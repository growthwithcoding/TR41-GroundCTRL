/**
 * NOVA Service
 * 
 * Core AI tutoring logic for the NOVA assistant
 * Integrates with Google Gemini for intelligent responses
 * Implements step-aware context building and fallback mechanisms
 * 
 * Phase 10 Implementation - NOVA AI End-to-End Integration
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiMessagesRepository = require('../repositories/aiMessagesRepository');
const commandRepository = require('../repositories/commandRepository');
const scenarioSessionRepository = require('../repositories/scenarioSessionRepository');
const scenarioStepRepository = require('../repositories/scenarioStepRepository');
const scenarioRepository = require('../repositories/scenarioRepository');
const helpArticleRepository = require('../repositories/helpArticleRepository');
const helpFaqRepository = require('../repositories/helpFaqRepository');
const { generateAnonymousId, generateHelpSessionId, isAnonymousId } = require('../utils/anonymousId');
const aiQueue = require('./aiQueue');
const logger = require('../utils/logger');

// Gemini model configuration - can be overridden via environment variable
// For v1beta API (2026 keys): gemini-1.5-pro, gemini-1.5-flash
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 1000,
  topP: 0.95,
  topK: 40,
};

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

// Context limits
const MAX_HISTORY_MESSAGES = 10;
const MAX_RECENT_COMMANDS = 5;

/**
 * Initialize Gemini AI client
 * @returns {object|null} Gemini model instance or null if not configured
 */
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not configured - NOVA will use fallback responses');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: GEMINI_MODEL });
  } catch (error) {
    logger.error('Failed to initialize Gemini AI', { error: error.message });
    return null;
  }
}

/**
 * Sleep utility for retry delays with jitter
 * @param {number} ms - Base delay in milliseconds
 * @returns {Promise}
 */
function sleep(ms) {
  // Add jitter: random value between 0.5x and 1.5x the base delay
  const jitter = ms * (0.5 + Math.random());
  return new Promise(resolve => setTimeout(resolve, jitter));
}

/**
 * Build step-aware prompt for NOVA (Simulator Training Mode)
 * Follows Gemini best practices for structured prompts
 * Implements NOVA's focused scope and hallucination controls
 * 
 * @param {object} context - Context object with scenario, step, commands, history
 * @param {string} userMessage - User's message/question
 * @returns {string} Formatted prompt
 */
function buildStepAwarePrompt(context, userMessage) {
  const { scenario, currentStep, recentCommands, sessionHistory, sessionState } = context;

  // Build context sections
  let contextSection = '<context>\n';
  
  // Scenario context
  if (scenario) {
    contextSection += `<scenario>
Title: ${scenario.title || 'Unknown Scenario'}
Description: ${scenario.description || 'No description'}
Difficulty: ${scenario.difficulty || 'Unknown'}
Type: ${scenario.type || 'GUIDED'}
</scenario>\n`;
  }

  // Current step context
  if (currentStep) {
    contextSection += `<current_step>
Title: ${currentStep.title || 'Unknown Step'}
Instruction: ${currentStep.instruction || 'No instruction'}
Objective: ${currentStep.objective || 'No objective'}
Hint Suggestion: ${currentStep.hint_suggestion || 'No hint available'}
</current_step>\n`;
  }

  // Session state
  if (sessionState) {
    contextSection += `<session_state>
Status: ${sessionState.status || 'Unknown'}
Score: ${sessionState.score || 0}
Hints Used: ${sessionState.total_hints_used || 0}
Errors: ${sessionState.total_errors || 0}
</session_state>\n`;
  }

  // Recent commands
  if (recentCommands && recentCommands.length > 0) {
    contextSection += '<recent_commands>\n';
    recentCommands.forEach((cmd, i) => {
      contextSection += `${i + 1}. ${cmd.commandName}: ${cmd.resultStatus} - ${cmd.resultMessage || 'No message'}\n`;
    });
    contextSection += '</recent_commands>\n';
  }

  // Conversation history
  if (sessionHistory && sessionHistory.length > 0) {
    contextSection += '<conversation_history>\n';
    sessionHistory.forEach(msg => {
      contextSection += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    });
    contextSection += '</conversation_history>\n';
  }

  contextSection += '</context>\n';

  // User query section
  const querySection = `<user_query>${userMessage}</user_query>\n`;

  // NOVA Identity and Instructions - Enhanced with scope and hallucination controls
  const instructionsSection = `<instructions>
# NOVA Identity and Role

You are NOVA, the onboard AI assistant embedded inside the GroundCTRL virtual satellite simulator. Your **only** job is to help people use GroundCTRL and learn satellite operations through this app.

## System Role
- You are NOT a general-purpose chatbot
- You are a **specialist** assistant for:
  * GroundCTRL app features and UI
  * GroundCTRL missions, scenarios, and training flows  
  * Basic satellite-operations concepts as they relate to this simulator
- Always assume the user is currently inside GroundCTRL's training simulator
- When a question could be interpreted in multiple ways, **prefer the interpretation that is about GroundCTRL**

## Primary Goals (In Order of Priority)
1. Help the user complete their **current mission, scenario, or step** in GroundCTRL
2. Help the user understand how to use **the GroundCTRL UI** (buttons, panels, telemetry, commands)
3. Teach foundational **satellite operations concepts** only as needed to:
   - Explain what they see on-screen
   - Explain why a particular action or command matters
   - Help them learn from the simulator in a practical way
4. Refuse or deflect questions that are **clearly outside** GroundCTRL's scope

## Current Context Awareness
You have been provided with:
- Current scenario: "${scenario?.title || 'Unknown'}"
- Current step: "${currentStep?.title || 'Unknown'}"
- Recent commands executed
- Session progress and state
- Conversation history

## Response Guidelines
1. **Stay grounded in provided context** - Only reference information explicitly provided above
2. **Be reason-aware and transparent** - When inferring from context, say so explicitly:
   - "According to this scenario's description..."
   - "Based on your current step..."
3. **Avoid hallucinations** - Do NOT make up:
   - New GroundCTRL features, pages, or buttons not mentioned in context
   - Specific internal API routes or implementation details
   - Real-world satellite design data that is not clearly generic
4. **Ask for clarification instead of guessing** - If ambiguous, clarify:
   - "Do you mean in GroundCTRL's simulator, or orbits in general?"
5. **Be concise and actionable** - Prefer 2-5 concrete steps they can take in the simulator
6. **Progressive hints** - If stuck, provide conceptual hints first, then procedural
7. **Acknowledge command results** - Reference recent commands and explain outcomes
8. **Use Mission Control communication style** - Clear, professional, supportive
9. **Keep responses under 200 words** unless explaining complex concepts
10. **Connect theory to practice** - When teaching concepts, link to what they see on-screen

## Hint Classification
If providing a hint, categorize as:
- CONCEPTUAL: Explains the underlying principle or concept
- PROCEDURAL: Step-by-step instructions
- TROUBLESHOOTING: Debugging command failures or errors
- CONTEXTUAL: References the current step's hint_suggestion

## Out-of-Scope Handling
If the user asks about topics clearly outside GroundCTRL and satellite operations training:
- Briefly decline: "I'm focused on helping with GroundCTRL and satellite-operations training. I can't help with that topic."
- Redirect: "I can explain your current scenario or help you use the simulator."

## When You Don't Know
If information is missing or unknown:
- Say explicitly: "I'm not given the details of that satellite's orbit in this context."
- Suggest next steps: "Try opening the Orbit View panel or checking the mission briefing card."

Remember: You're helping train future satellite operators through GroundCTRL. Stay focused on their current mission and learning objectives. Safety and precision matter.
</instructions>`;

  return contextSection + querySection + instructionsSection;
}

/**
 * Detect if NOVA response contains a hint
 * @param {string} response - NOVA's response text
 * @param {boolean} requestedHint - Whether user explicitly requested a hint
 * @returns {string|null} Hint type or null
 */
function detectHintType(response, requestedHint) {
  const lowerResponse = response.toLowerCase();
  
  if (requestedHint) {
    return 'CONTEXTUAL';
  }
  
  // Check for hint indicators in response
  if (lowerResponse.includes('hint:') || lowerResponse.includes('tip:') || lowerResponse.includes('suggestion:')) {
    if (lowerResponse.includes('concept') || lowerResponse.includes('understand') || lowerResponse.includes('theory')) {
      return 'CONCEPTUAL';
    }
    if (lowerResponse.includes('step') || lowerResponse.includes('first') || lowerResponse.includes('then') || lowerResponse.includes('next')) {
      return 'PROCEDURAL';
    }
    if (lowerResponse.includes('error') || lowerResponse.includes('issue') || lowerResponse.includes('problem') || lowerResponse.includes('fix')) {
      return 'TROUBLESHOOTING';
    }
    return 'CONTEXTUAL';
  }
  
  return null;
}

/**
 * Fetch context for NOVA response generation
 * 
 * @param {string} sessionId - Session ID
 * @param {string} stepId - Optional current step ID
 * @returns {Promise<object>} Context object
 */
async function fetchContext(sessionId, stepId = null) {
  const context = {
    scenario: null,
    currentStep: null,
    recentCommands: [],
    sessionHistory: [],
    sessionState: null,
  };

  try {
    // Get session data
    const session = await scenarioSessionRepository.getById(sessionId);
    if (session) {
      context.sessionState = {
        status: session.status,
        score: session.score,
        total_hints_used: session.total_hints_used,
        total_errors: session.total_errors,
      };

      // Get scenario
      if (session.scenario_id) {
        const scenario = await scenarioRepository.getById(session.scenario_id);
        if (scenario) {
          context.scenario = scenario;
        }
      }

      // Get current step
      const currentStepId = stepId || session.current_step_id;
      if (currentStepId) {
        const step = await scenarioStepRepository.getById(currentStepId);
        if (step) {
          context.currentStep = step;
        }
      }
    }

    // Get recent commands
    const commands = await commandRepository.getBySessionId(sessionId, { limit: MAX_RECENT_COMMANDS });
    context.recentCommands = commands;

    // Get conversation history
    const history = await aiMessagesRepository.getRecentMessages(sessionId, MAX_HISTORY_MESSAGES);
    context.sessionHistory = history;

  } catch (error) {
    logger.error('Failed to fetch NOVA context', { error: error.message, sessionId });
    // Continue with partial context
  }

  return context;
}

/**
 * Get fallback response when Gemini is unavailable
 * Uses step hint_suggestion or generic fallback
 * 
 * @param {object} context - Context object
 * @param {string} _userMessage - User's message (unused but kept for API consistency)
 * @returns {object} Fallback response object
 */
function getFallbackResponse(context, _userMessage) {
  let response;
  let hintType = 'FALLBACK';

  // Try to use step hint_suggestion
  if (context.currentStep?.hint_suggestion) {
    response = `NOVA here. I'm experiencing some communication delays, but I can offer you a hint for this step:\n\n${context.currentStep.hint_suggestion}\n\nLet me know if you need more specific guidance once my connection stabilizes.`;
  } else if (context.scenario) {
    response = `NOVA here. I'm experiencing some communication delays. You're currently working on "${context.scenario.title}". Try reviewing your recent command results and the step objectives. I'll be back with full assistance shortly.`;
  } else {
    response = 'NOVA here. I\'m experiencing some communication delays. Please continue with your current task, and I\'ll be back with full assistance shortly. Review your command console for immediate feedback.';
  }

  return { response, hintType, isFallback: true };
}

/**
 * Generate NOVA response using Gemini with retry logic
 * 
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID (uid)
 * @param {string} userMessage - User's message
 * @param {object} options - Additional options
 * @param {string} options.step_id - Current step ID
 * @param {string} options.command_id - Related command ID
 * @param {boolean} options.request_hint - Whether user explicitly requested a hint
 * @returns {Promise<object>} Response object with content and metadata
 */
async function generateNovaResponse(sessionId, userId, userMessage, options = {}) {
  const { step_id, command_id, request_hint } = options;

  // Store user message first
  await aiMessagesRepository.addMessage(sessionId, userId, 'user', userMessage, {
    step_id,
    command_id,
  });

  // Fetch context
  const context = await fetchContext(sessionId, step_id);

  // Get Gemini model
  const model = getGeminiModel();
  
  if (!model) {
    // No API key configured - use fallback
    const fallback = getFallbackResponse(context, userMessage);
    await storeResponse(sessionId, userId, fallback.response, {
      step_id,
      command_id,
      hint_type: fallback.hintType,
      is_fallback: true,
    });
    
    // Increment hints_used if this was a hint
    if (request_hint) {
      await incrementSessionHints(sessionId);
    }
    
    return {
      content: fallback.response,
      hint_type: fallback.hintType,
      is_fallback: true,
    };
  }

  // Build prompt
  const fullPrompt = buildStepAwarePrompt(context, userMessage);

  // Try to get response with retries - wrapped in queue for rate limiting
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Wrap AI call in queue to prevent rate limit errors
      const result = await aiQueue.addToQueue(
        async () => {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS);
          });

          // Generate content with timeout
          const generatePromise = model.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            generationConfig: GENERATION_CONFIG,
          });

          return await Promise.race([generatePromise, timeoutPromise]);
        },
        {
          priority: request_hint ? 1 : 0, // Prioritize hint requests
          metadata: {
            sessionId,
            userId,
            type: 'training',
            attempt,
          },
        }
      );

      const responseText = result.response.text();

      // Detect if this is a hint
      const hintType = detectHintType(responseText, request_hint);

      // Store assistant response
      await storeResponse(sessionId, userId, responseText, {
        step_id,
        command_id,
        hint_type: hintType,
        is_fallback: false,
        extra: {
          model: GEMINI_MODEL,
          attempt,
        },
      });

      // Increment hints_used if this was a hint
      if (hintType || request_hint) {
        await incrementSessionHints(sessionId);
      }

      return {
        content: responseText,
        hint_type: hintType,
        is_fallback: false,
      };

    } catch (error) {
      lastError = error;
      logger.warn(`NOVA generation attempt ${attempt} failed`, {
        error: error.message,
        sessionId,
        attempt,
      });

      if (attempt < MAX_RETRIES) {
        // Exponential backoff with jitter
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  // All retries failed - use fallback
  logger.error('NOVA generation failed after all retries', {
    error: lastError?.message,
    sessionId,
  });

  const fallback = getFallbackResponse(context, userMessage);
  await storeResponse(sessionId, userId, fallback.response, {
    step_id,
    command_id,
    hint_type: fallback.hintType,
    is_fallback: true,
  });

  if (request_hint) {
    await incrementSessionHints(sessionId);
  }

  return {
    content: fallback.response,
    hint_type: fallback.hintType,
    is_fallback: true,
    error: lastError?.message,
  };
}

/**
 * Store assistant response in repository
 * 
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} content - Response content
 * @param {object} metadata - Response metadata
 */
async function storeResponse(sessionId, userId, content, metadata = {}) {
  return aiMessagesRepository.addMessage(sessionId, userId, 'assistant', content, metadata);
}

/**
 * Increment total_hints_used in session
 * 
 * @param {string} sessionId - Session ID
 */
async function incrementSessionHints(sessionId) {
  try {
    const session = await scenarioSessionRepository.getById(sessionId);
    if (session) {
      const currentHints = session.total_hints_used || 0;
      await scenarioSessionRepository.patch(sessionId, {
        total_hints_used: currentHints + 1,
      });
    }
  } catch (error) {
    logger.error('Failed to increment session hints', { error: error.message, sessionId });
    // Non-critical - don't throw
  }
}

/**
 * Get session conversation history
 * 
 * @param {string} sessionId - Session ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Paginated messages
 */
async function getSessionHistory(sessionId, options = {}) {
  return aiMessagesRepository.getMessagesBySession(sessionId, options);
}

/**
 * Build help-aware prompt for NOVA
 * For public help queries with relevant help articles
 * 
 * @param {object} context - Context object with help articles, FAQs, history
 * @param {string} userMessage - User's question
 * @returns {string} Formatted prompt
 */
function buildHelpAwarePrompt(context, userMessage) {
  const { helpArticles, faqs, conversationHistory } = context;

  let contextSection = '<context>\n';

  // Help articles context
  if (helpArticles && helpArticles.length > 0) {
    contextSection += '<relevant_help_articles>\n';
    helpArticles.forEach((article, i) => {
      contextSection += `${i + 1}. ${article.title}\n`;
      if (article.excerpt) {
        contextSection += `   Excerpt: ${article.excerpt}\n`;
      }
      if (article.content) {
        // Truncate content to first 500 chars
        const truncated = article.content.substring(0, 500);
        contextSection += `   Content: ${truncated}${article.content.length > 500 ? '...' : ''}\n`;
      }
    });
    contextSection += '</relevant_help_articles>\n';
  }

  // FAQs context
  if (faqs && faqs.length > 0) {
    contextSection += '<relevant_faqs>\n';
    faqs.forEach((faq, i) => {
      contextSection += `${i + 1}. Q: ${faq.question}\n`;
      contextSection += `   A: ${faq.answer}\n`;
    });
    contextSection += '</relevant_faqs>\n';
  }

  // Conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    contextSection += '<conversation_history>\n';
    conversationHistory.forEach(msg => {
      contextSection += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    });
    contextSection += '</conversation_history>\n';
  }

  contextSection += '</context>\n';

  // User query
  const querySection = `<user_query>${userMessage}</user_query>\n`;

  // Instructions - Enhanced with NOVA scope and hallucination controls
  const instructionsSection = `<instructions>
# NOVA Identity and Role

You are NOVA, the onboard AI assistant for GroundCTRL (missionctrl.org) and its virtual satellite simulator. Your **only** job is to help people use GroundCTRL and learn satellite operations through this app.

## System Role
- You are NOT a general-purpose chatbot
- You are a **specialist** assistant for:
  * GroundCTRL app features and help system
  * GroundCTRL missions, scenarios, and training
  * Basic satellite-operations concepts as they relate to this simulator
- When a question could be interpreted in multiple ways, **prefer the interpretation that is about GroundCTRL**

## Primary Goals (In Order of Priority)
1. Help users understand and use the **GroundCTRL platform** (features, navigation, help articles)
2. Answer questions about **satellite operations concepts** as they relate to GroundCTRL training
3. Guide users toward relevant help articles, FAQs, and training scenarios
4. Refuse or deflect questions that are **clearly outside** GroundCTRL's scope

## Current Context
You have been provided with:
- Relevant help articles
- Related FAQs
- Conversation history (if multi-turn)

## Response Guidelines
1. **Stay grounded in provided context** - Reference the help articles and FAQs provided
2. **Be reason-aware and transparent**:
   - "According to the help article on [topic]..."
   - "Based on the FAQs provided..."
3. **Avoid hallucinations** - Do NOT make up:
   - GroundCTRL features, pages, or buttons not described in help articles
   - Specific technical implementations or API details
   - Real-world satellite missions or systems beyond generic concepts
4. **Ask for clarification instead of guessing**:
   - "Do you mean how this works in GroundCTRL's simulator, or in general?"
5. **Be concise and actionable** - Provide 2-5 concrete steps when applicable
6. **Reference help articles** - If a question relates to a help article, mention it by name
7. **Encourage exploration** - Suggest related articles and training scenarios
8. **Keep responses under 300 words** unless explaining complex concepts
9. **Connect theory to practice** - Link concepts to what they can do in GroundCTRL

## In-Scope vs Out-of-Scope

### IN-SCOPE (answer these):
- Questions about GroundCTRL: "What is GroundCTRL?", "How do I use X panel?"
- Questions about help articles and FAQs
- Basic satellite operations related to training: orbits, passes, telemetry, commands
- Learning questions: "Can you explain what telemetry means?"
- Training scenarios: "What missions are available?", "What should I try next?"

### OUT-OF-SCOPE (politely decline these):
- General internet search, news, politics, unrelated trivia
- Coding help or backend implementation details
- Deep real-world mission planning unrelated to the simulator
- Topics completely unrelated to satellites or GroundCTRL

## Handling Borderline Topics
Some questions may sound out of scope but can be tied back to your purpose. **First try to interpret them through the GroundCTRL lens**.

Examples:
- "How do real satellites avoid collisions?" → In-scope IF you give brief overview THEN connect to GroundCTRL
- "What jobs use these skills?" → In-scope IF you relate to what they're practicing in GroundCTRL
- "Compare GroundCTRL to other tools?" → Explain what GroundCTRL focuses on, but don't make claims about competitors

## Out-of-Scope Refusal Template
When you must decline:
- Brief refusal: "I'm focused on helping with GroundCTRL and satellite-operations training. I can't help with that topic."
- Redirect: "If you'd like, I can explain how to use the simulator or recommend a training scenario."

## When You Don't Know
If information is missing or unknown:
- Say explicitly: "I don't have enough information about that in the help articles provided."
- Suggest next steps: "Try searching the help articles or browsing the FAQ section."

Remember: You're helping users learn about GroundCTRL and satellite operations through this platform. Stay focused, grounded, and supportive.
</instructions>`;

  return contextSection + querySection + instructionsSection;
}

/**
 * Fetch user history stats for authenticated help
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} User history object
 */
async function fetchUserHistory(userId) {
  try {
    // Get all user sessions
    const sessions = await scenarioSessionRepository.getAll({ 
      user_id: userId,
      limit: 50 // Last 50 sessions
    });

    const completedSessions = sessions.data.filter(s => s.status === 'COMPLETED');
    const recentScenarios = [];
    
    // Get unique recent scenario titles
    for (const session of sessions.data.slice(0, 5)) {
      if (session.scenario_id) {
        try {
          const scenario = await scenarioRepository.getById(session.scenario_id);
          if (scenario && !recentScenarios.includes(scenario.title)) {
            recentScenarios.push(scenario.title);
          }
        // eslint-disable-next-line no-unused-vars
        } catch (_e) {
          // Ignore missing scenarios
        }
      }
    }

    return {
      totalSessions: sessions.total,
      completedScenarios: completedSessions.length,
      recentScenarios
    };
  } catch (error) {
    logger.error('Failed to fetch user history', { error: error.message, userId });
    return {
      totalSessions: 0,
      completedScenarios: 0,
      recentScenarios: []
    };
  }
}

/**
 * Fetch help context for public NOVA queries
 * Searches help articles and FAQs relevant to user question
 * 
 * @param {string} userMessage - User's question
 * @param {string} articleSlug - Optional specific article slug
 * @param {string} conversationId - Optional conversation ID for history
 * @param {object} userHistory - Optional user history for authenticated users
 * @returns {Promise<object>} Context object with help content
 */
async function fetchHelpContext(userMessage, articleSlug = null, conversationId = null, userHistory = null) {
  const context = {
    helpArticles: [],
    faqs: [],
    conversationHistory: [],
    userHistory: userHistory // Attach user history if provided
  };

  try {
    // If specific article slug provided, fetch it
    if (articleSlug) {
      const article = await helpArticleRepository.getBySlug(articleSlug);
      if (article) {
        context.helpArticles.push(article);
      }
    }

    // Search for relevant help articles (limit to top 3)
    const searchResults = await helpArticleRepository.search(userMessage, {}, 3);
    context.helpArticles.push(...searchResults);

    // Remove duplicates if article was both directly fetched and in search results
    context.helpArticles = Array.from(
      new Map(context.helpArticles.map(a => [a.id, a])).values()
    );

    // Search for relevant FAQs (limit to top 3)
    const faqsResult = await helpFaqRepository.getAll({ status: 'PUBLISHED', isActive: true });
    const allFaqs = faqsResult.data || faqsResult || [];
    const lowerQuery = userMessage.toLowerCase();
    context.faqs = allFaqs
      .filter(faq => 
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery) ||
        (faq.tags && faq.tags.some(tag => lowerQuery.includes(tag.toLowerCase())))
      )
      .slice(0, 3);

    // Get conversation history if conversationId provided
    if (conversationId) {
      const history = await aiMessagesRepository.getRecentMessages(conversationId, MAX_HISTORY_MESSAGES);
      context.conversationHistory = history;
    }

  } catch (error) {
    logger.error('Failed to fetch help context', { error: error.message, userMessage });
    // Continue with partial context
  }

  return context;
}

/**
 * Generate NOVA help response for public/authenticated queries
 * Handles anonymous and authenticated users with appropriate context
 * 
 * @param {string} userMessage - User's question
 * @param {object} options - Additional options
 * @param {string} options.userId - User ID (or null for anonymous)
 * @param {string} options.context - Optional help article slug
 * @param {string} options.conversationId - Optional conversation ID
 * @param {string} options.callSign - Optional call sign for authenticated users
 * @returns {Promise<object>} Response object with content and metadata
 */
async function generateHelpResponse(userMessage, options = {}) {
  const { 
    userId: providedUserId, 
    context: articleSlug, 
    conversationId: providedConversationId,
    callSign
  } = options;

  // Generate anonymous ID if no user ID provided
  const userId = providedUserId || generateAnonymousId();
  const isAuthenticated = !!providedUserId && !isAnonymousId(userId);
  
  // Generate or use provided conversation ID
  const conversationId = providedConversationId || generateHelpSessionId();

  // Store user message
  await aiMessagesRepository.addMessage(conversationId, userId, 'user', userMessage, {
    metadata: {
      message_type: 'HELP',
      article_context: articleSlug || null,
      is_authenticated: isAuthenticated
    },
  });

  // Fetch user history if authenticated
  let userHistory = null;
  if (isAuthenticated) {
    userHistory = await fetchUserHistory(userId);
  }

  // Fetch help context (including user history)
  const helpContext = await fetchHelpContext(userMessage, articleSlug, conversationId, userHistory);

  // Get Gemini model
  const model = getGeminiModel();

  if (!model) {
    // Fallback response without AI
    const fallbackContent = helpContext.helpArticles.length > 0
      ? `I'm experiencing some connectivity issues, but I found these help articles that might assist you:\n\n${helpContext.helpArticles.map((a, i) => `${i + 1}. ${a.title}`).join('\n')}\n\nPlease check these articles for more information.`
      : 'I\'m experiencing connectivity issues. Please try browsing our help articles or FAQs for assistance, or try again in a moment.';

    await storeResponse(conversationId, userId, fallbackContent, {
      is_fallback: true,
      hint_type: 'FALLBACK',
      metadata: {
        message_type: 'HELP',
      },
    });

    return {
      content: fallbackContent,
      conversationId,
      is_fallback: true,
      userId,
    };
  }

  // Build prompt - use authenticated prompt if logged in, otherwise public help prompt
  const fullPrompt = isAuthenticated
    ? buildAuthenticatedHelpPrompt(helpContext, userMessage, callSign || 'OPERATOR')
    : buildHelpAwarePrompt(helpContext, userMessage);

  // Try to get response with retries - wrapped in queue for rate limiting
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Wrap AI call in queue to prevent rate limit errors
      const result = await aiQueue.addToQueue(
        async () => {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS);
          });

          // Generate content with timeout
          const generatePromise = model.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            generationConfig: GENERATION_CONFIG,
          });

          return await Promise.race([generatePromise, timeoutPromise]);
        },
        {
          priority: 0, // Normal priority for help requests
          metadata: {
            conversationId,
            userId,
            type: 'help',
            attempt,
            isAuthenticated,
          },
        }
      );

      const responseText = result.response.text();

      // Store assistant response
      await storeResponse(conversationId, userId, responseText, {
        is_fallback: false,
        metadata: {
          message_type: 'HELP',
          model: GEMINI_MODEL,
          attempt,
          articles_referenced: helpContext.helpArticles.length,
          faqs_referenced: helpContext.faqs.length,
        },
      });

      return {
        content: responseText,
        conversationId,
        is_fallback: false,
        userId,
      };

    } catch (error) {
      lastError = error;
      logger.warn(`Help NOVA generation attempt ${attempt} failed`, {
        error: error.message,
        conversationId,
        attempt,
      });

      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  // All retries failed - use fallback
  logger.error('Help NOVA generation failed after all retries', {
    error: lastError?.message,
    conversationId,
  });

  const fallbackContent = helpContext.helpArticles.length > 0
    ? `I'm experiencing some connectivity issues, but I found these help articles that might assist you:\n\n${helpContext.helpArticles.map((a, i) => `${i + 1}. ${a.title}`).join('\n')}\n\nPlease check these articles for more information.`
    : 'I\'m experiencing connectivity issues. Please try browsing our help articles or FAQs for assistance, or try again in a moment.';

  await storeResponse(conversationId, userId, fallbackContent, {
    is_fallback: true,
    hint_type: 'FALLBACK',
    metadata: {
      message_type: 'HELP',
    },
  });

  return {
    content: fallbackContent,
    conversationId,
    is_fallback: true,
    userId,
    error: lastError?.message,
  };
}

/**
 * UNIFIED NOVA RESPONSE GENERATOR
 * Automatically adapts based on authentication status and session presence
 * 
 * @param {string} content - User's message
 * @param {object} options - Configuration options
 * @param {string} options.userId - User ID (null/undefined for anonymous)
 * @param {string} options.sessionId - Session ID (for training mode)
 * @param {string} options.conversationId - Conversation ID (for help mode)
 * @param {string} options.stepId - Current step ID
 * @param {string} options.commandId - Related command ID
 * @param {boolean} options.requestHint - Explicit hint request
 * @param {string} options.context - Help article slug or context
 * @returns {Promise<object>} Unified response object
 */
async function generateUnifiedNovaResponse(content, options = {}) {
  const { 
    userId, 
    callSign,
    sessionId, 
    conversationId, 
    stepId, 
    commandId, 
    requestHint, 
    context: articleSlug 
  } = options;

  // Determine user type and mode
  const isAuthenticated = userId && !isAnonymousId(userId);
  const hasActiveSession = sessionId && isAuthenticated;

  let userType;
  let messageContext;
  let response;

  if (hasActiveSession) {
    // MODE 1: AUTHENTICATED WITH SESSION - Full training mode
    userType = 'AUTHENTICATED';
    messageContext = 'TRAINING';
    
    logger.info('NOVA: Training mode', { userId, sessionId });
    
    response = await generateNovaResponse(sessionId, userId, content, {
      step_id: stepId,
      command_id: commandId,
      request_hint: requestHint,
    });

    // Add context information
    response.context = {
      user_type: userType,
      message_context: messageContext,
      session_id: sessionId,
      capabilities: [
        'Full scenario context',
        'Progress tracking',
        'Step-by-step guidance',
        'Command history',
        'Personalized hints',
      ],
    };

  } else if (isAuthenticated) {
    // MODE 2: AUTHENTICATED NO SESSION - Enhanced help mode
    userType = 'AUTHENTICATED_NO_SESSION';
    messageContext = 'HELP';
    
    logger.info('NOVA: Authenticated help mode', { userId });

    // Get call sign from repository or assume OPERATOR if not available
    // In a real scenario, this should be passed from the controller/token
    // For now we'll fetch it if not provided (though userId is usually enough)
    
    // Use help response but with authenticated user
    const helpResponse = await generateHelpResponse(content, {
      userId,
      context: articleSlug,
      conversationId: conversationId || generateHelpSessionId(),
      callSign: callSign || 'OPERATOR'
    });

    response = {
      content: helpResponse.content,
      is_fallback: helpResponse.is_fallback,
      conversation_id: helpResponse.conversationId,
      user_id: helpResponse.userId,
      context: {
        user_type: userType,
        message_context: messageContext,
        conversation_id: helpResponse.conversationId,
        capabilities: [
          'Personalized help',
          'Help articles and FAQs',
          'Conversation history',
          'Support tickets',
          'Scenario recommendations',
        ],
        suggestion: 'Start a training scenario for guided, hands-on learning!',
      },
    };

  } else {
    // MODE 3: NOT AUTHENTICATED - Public help mode
    userType = 'ANONYMOUS';
    messageContext = 'HELP';
    
    logger.info('NOVA: Anonymous help mode');
    
    const helpResponse = await generateHelpResponse(content, {
      userId: null, // Will generate anonymous ID
      context: articleSlug,
      conversationId: conversationId || generateHelpSessionId(),
    });

    response = {
      content: helpResponse.content,
      is_fallback: helpResponse.is_fallback,
      conversation_id: helpResponse.conversationId,
      user_id: helpResponse.userId,
      context: {
        user_type: userType,
        message_context: messageContext,
        conversation_id: helpResponse.conversationId,
        capabilities: [
          'General help and guidance',
          'Help articles and FAQs',
          'Public resources',
          'Support tickets',
        ],
        suggestion: 'Sign in to unlock personalized training scenarios and track your progress!',
        auth_benefits: [
          'Personalized training scenarios',
          'Progress tracking',
          'Custom recommendations',
          'Full conversation history',
          'Priority support',
        ],
      },
    };
  }

  // Add related help articles for all modes
  if (messageContext === 'HELP') {
    try {
      const searchResults = await helpArticleRepository.search(content, {}, 3);
      if (searchResults && searchResults.length > 0) {
        response.related_articles = searchResults.map(article => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
        }));
      }
    } catch (error) {
      logger.warn('Failed to fetch related articles', { error: error.message });
    }
  }

  return response;
}

/**
 * Build authenticated help prompt
 * Enhanced version for logged-in users without active session
 * 
 * @param {object} context - Context with help data and user history
 * @param {string} userMessage - User's question
 * @param {string} callSign - User's call sign
 * @returns {string} Formatted prompt
 */
function buildAuthenticatedHelpPrompt(context, userMessage, callSign) {
  const { helpArticles, faqs, conversationHistory, userHistory } = context;

  let contextSection = '<context>\n';
  contextSection += `<user>\nCall Sign: ${callSign}\nAuthenticated: Yes\n</user>\n`;

  // User history if available
  if (userHistory && userHistory.completedScenarios > 0) {
    contextSection += '<user_history>\n';
    contextSection += `Completed Scenarios: ${userHistory.completedScenarios}\n`;
    contextSection += `Total Sessions: ${userHistory.totalSessions}\n`;
    if (userHistory.recentScenarios && userHistory.recentScenarios.length > 0) {
      contextSection += `Recent Training: ${userHistory.recentScenarios.join(', ')}\n`;
    }
    contextSection += '</user_history>\n';
  }

  // Help articles context
  if (helpArticles && helpArticles.length > 0) {
    contextSection += '<relevant_help_articles>\n';
    helpArticles.forEach((article, i) => {
      contextSection += `${i + 1}. ${article.title}\n`;
      if (article.excerpt) {
        contextSection += `   Excerpt: ${article.excerpt}\n`;
      }
    });
    contextSection += '</relevant_help_articles>\n';
  }

  // FAQs context
  if (faqs && faqs.length > 0) {
    contextSection += '<relevant_faqs>\n';
    faqs.forEach((faq, i) => {
      contextSection += `${i + 1}. Q: ${faq.question}\n`;
      contextSection += `   A: ${faq.answer}\n`;
    });
    contextSection += '</relevant_faqs>\n';
  }

  // Conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    contextSection += '<conversation_history>\n';
    conversationHistory.forEach(msg => {
      contextSection += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    });
    contextSection += '</conversation_history>\n';
  }

  contextSection += '</context>\n';

  const querySection = `<user_query>${userMessage}</user_query>\n`;

  const instructionsSection = `<instructions>
# NOVA Identity and Role

You are NOVA, the onboard AI assistant for GroundCTRL (missionctrl.org). Your **only** job is to help people use GroundCTRL and learn satellite operations through this app.

User: ${callSign} (Authenticated)

## System Role
- You are NOT a general-purpose chatbot
- You are a **specialist** assistant for GroundCTRL and satellite operations training
- This user is authenticated, so you have access to their training history and can provide personalized help
- When a question could be interpreted in multiple ways, **prefer the interpretation that is about GroundCTRL**

## Primary Goals (In Order of Priority)
1. Provide **personalized help** based on user's experience level and training history
2. Help with **GroundCTRL platform** usage (features, navigation, help articles)
3. Answer questions about **satellite operations concepts** as they relate to GroundCTRL
4. **Recommend specific scenarios** that match their skill level and interests
5. Refuse or deflect questions that are **clearly outside** GroundCTRL's scope

## Current Context
You have been provided with:
- User's call sign: ${callSign}
- Training history (completed scenarios, total sessions)
- Relevant help articles
- Related FAQs
- Conversation history (if multi-turn)

## Response Guidelines
1. **Stay grounded in provided context** - Reference their actual training history and help articles
2. **Be reason-aware and transparent**:
   - "Based on your completed training in [scenario]..."
   - "According to the help article on [topic]..."
3. **Avoid hallucinations** - Do NOT make up:
   - Scenarios they haven't completed
   - GroundCTRL features not in help articles
   - Specific implementations or technical details
4. **Personalize recommendations**:
   - If they've completed basic scenarios, suggest intermediate ones
   - Reference their recent training when relevant
   - Tailor complexity to their experience level
5. **Be concise and actionable** - Provide 2-5 concrete steps when applicable
6. **Reference help articles and FAQs** - Mention by name when relevant
7. **Encourage hands-on practice** - Suggest starting a training scenario when appropriate
8. **Keep responses under 300 words** unless explaining complex concepts
9. **Connect theory to practice** - Link concepts to what they can do in GroundCTRL

## In-Scope vs Out-of-Scope

### IN-SCOPE (answer these):
- GroundCTRL platform questions
- Help articles and FAQ guidance
- Satellite operations concepts (as related to training)
- Scenario recommendations based on their progress
- Learning questions tied to their training
- Career advice related to satellite operations skills

### OUT-OF-SCOPE (politely decline these):
- General internet search, news, politics, unrelated topics
- Coding help or implementation details
- Deep real-world missions unrelated to simulator
- Topics completely unrelated to satellites or GroundCTRL

## Handling Borderline Topics
Try to interpret questions through the GroundCTRL lens first:
- "How do satellites work?" → Relate to what they've learned in scenarios
- "Career opportunities?" → Connect to skills they're developing in GroundCTRL
- "Compare to other tools?" → Focus on what GroundCTRL offers, don't criticize competitors

## Out-of-Scope Refusal Template
When you must decline:
- "I'm focused on helping with GroundCTRL and satellite-operations training. I can't help with that topic."
- Then redirect: "Based on your training history, I can recommend [specific scenario] or explain [relevant concept]."

## When You Don't Know
If information is missing:
- Say explicitly: "I don't have that information in your training history."
- Suggest: "Try checking your progress dashboard or searching the help articles."

Remember: You're providing personalized support for ${callSign}. Use their training history to guide them effectively. Stay focused on GroundCTRL and their learning journey.
</instructions>`;

  return contextSection + querySection + instructionsSection;
}

/**
 * Split content into paragraphs for multi-bubble rendering
 * Splits on: double newlines, OR single newlines if paragraph is long (>200 chars)
 * This creates semantic line breaks that frontend will render as separate bubbles
 * 
 * @param {string} content - Raw NOVA response content
 * @returns {array} Array of paragraph strings
 */
function splitIntoParagraphs(content) {
  if (!content || typeof content !== 'string') return [];
  
  // First split on double newlines (explicit paragraph breaks)
  let paragraphs = content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // If we only have 1 paragraph and it's long, split on single newlines
  if (paragraphs.length === 1 && paragraphs[0].length > 200) {
    const lines = paragraphs[0].split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    
    // If we have multiple lines, use them as separate paragraphs
    if (lines.length > 1) {
      paragraphs = lines;
    }
  }
  
  // If still only 1 paragraph and it's very long (>400 chars), split on sentence boundaries
  if (paragraphs.length === 1 && paragraphs[0].length > 400) {
    const sentences = paragraphs[0].match(/[^.!?]+[.!?]+/g) || [paragraphs[0]];
    
    // Group sentences into chunks of ~200-300 characters
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 300 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    if (chunks.length > 1) {
      paragraphs = chunks;
    }
  }
  
  return paragraphs;
}

/**
 * Generate context-aware suggestions for user actions
 * 
 * @param {string} context - 'help' or 'simulator' 
 * @param {string} content - The NOVA response content (used for smart filtering)
 * @returns {array} Array of 2-3 suggestion objects
 */
function generateSuggestions(context, content) {
  const contentLower = content.toLowerCase();
  
  // Define suggestions by context
  const suggestionSets = {
    help: [
      {
        id: 'modules',
        label: 'Show training modules',
        action: 'List all available training modules for me'
      },
      {
        id: 'recommend',
        label: 'Recommend a mission',
        action: 'What mission should I try next based on my progress?'
      },
      {
        id: 'search',
        label: 'Search articles',
        action: 'How do I search the help articles?'
      },
      {
        id: 'categories',
        label: 'Browse categories',
        action: 'Show me all help categories'
      }
    ],
    simulator: [
      {
        id: 'hint',
        label: 'Get a hint',
        action: 'Can you give me a hint for this objective?'
      },
      {
        id: 'explain',
        label: 'Explain objective',
        action: 'Explain what I need to do in this step'
      },
      {
        id: 'command',
        label: 'Command help',
        action: 'Help me understand the available commands'
      },
      {
        id: 'telemetry',
        label: 'Explain telemetry',
        action: 'Explain what the telemetry readings mean'
      }
    ]
  };

  const contextSuggestions = suggestionSets[context] || suggestionSets.help;
  
  // Smart filtering: if response mentions "training", prioritize modules
  if (contentLower.includes('training') || contentLower.includes('module')) {
    const filtered = contextSuggestions.filter(s => s.id === 'modules');
    if (filtered.length > 0) return filtered.concat(contextSuggestions.filter(s => s.id !== 'modules')).slice(0, 2);
  }
  
  // If response mentions "mission" or "scenario", prioritize recommend
  if (contentLower.includes('mission') || contentLower.includes('scenario')) {
    const filtered = contextSuggestions.filter(s => s.id === 'recommend');
    if (filtered.length > 0) return filtered.concat(contextSuggestions.filter(s => s.id !== 'recommend')).slice(0, 2);
  }

  // If response mentions commands, prioritize command help
  if (contentLower.includes('command') || contentLower.includes('execute')) {
    const filtered = contextSuggestions.filter(s => s.id === 'command');
    if (filtered.length > 0) return filtered.concat(contextSuggestions.filter(s => s.id !== 'command')).slice(0, 2);
  }

  // Default: return first 2 suggestions
  return contextSuggestions.slice(0, 2);
}

/**
 * Format NOVA response with paragraphs and suggestions
 * 
 * @param {string} content - Raw NOVA response from Gemini API
 * @param {string} context - 'help' or 'simulator'
 * @returns {object} Formatted response object with paragraphs and suggestions
 */
function formatNovaResponse(content, context = 'help') {
  const paragraphs = splitIntoParagraphs(content);
  const suggestions = generateSuggestions(context, content);

  return {
    role: 'assistant',
    content: content, // Full text for backwards compatibility
    paragraphs: paragraphs, // Array of paragraph strings for frontend
    suggestion_ids: suggestions.map(s => s.id), // IDs only (suggestions sent separately)
    hint_type: null // Can be set if this is a hint response
  };
}

module.exports = {
  generateNovaResponse,
  generateHelpResponse,
  generateUnifiedNovaResponse,
  storeResponse,
  getSessionHistory,
  fetchContext,
  fetchHelpContext,
  buildStepAwarePrompt,
  buildHelpAwarePrompt,
  buildAuthenticatedHelpPrompt,
  incrementSessionHints,
  splitIntoParagraphs,
  generateSuggestions,
  formatNovaResponse,
};
