/**
 * Support Service
 * 
 * Handles support ticket creation and management
 * Works with both authenticated and anonymous users
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// In production, this would integrate with a ticketing system like Zendesk, Intercom, etc.
// For now, we'll store in Firestore or log them

/**
 * Create a support ticket from NOVA conversation
 * 
 * @param {object} options - Ticket creation options
 * @param {string} options.userId - User ID (can be anonymous)
 * @param {string} options.userEmail - User email if available
 * @param {string} options.conversationId - Conversation ID for context
 * @param {string} options.subject - Ticket subject
 * @param {string} options.content - Ticket content/description
 * @param {string} options.category - Ticket category (GENERAL, TECHNICAL, BUG, FEATURE)
 * @param {string} options.priority - Priority level (LOW, MEDIUM, HIGH, URGENT)
 * @param {array} options.conversationHistory - Message history for context
 * @returns {Promise<object>} Created ticket
 */
async function createSupportTicket(options = {}) {
  const {
    userId,
    userEmail,
    conversationId,
    subject,
    content,
    category = 'GENERAL',
    priority = 'MEDIUM',
    conversationHistory = []
  } = options;

  const ticketId = `ticket_${uuidv4()}`;
  
  const ticket = {
    id: ticketId,
    userId,
    userEmail,
    conversationId,
    subject,
    content,
    category,
    priority,
    status: 'OPEN',
    source: 'NOVA_AI',
    conversationHistory: conversationHistory.slice(-10), // Last 10 messages
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // TODO: In production, integrate with actual ticketing system
  // For now, log it
  logger.info('Support ticket created', {
    ticketId,
    userId,
    category,
    priority,
    hasConversationHistory: conversationHistory.length > 0
  });

  // In production, you would:
  // 1. Store in Firestore: db.collection('support_tickets').add(ticket)
  // 2. Send to external system: await ticketingAPI.createTicket(ticket)
  // 3. Send notification email to support team
  // 4. Send confirmation email to user

  return ticket;
}

/**
 * Check if user message indicates need for support escalation
 * 
 * @param {string} content - User's message content
 * @param {object} context - Additional context
 * @returns {object} Escalation recommendation
 */
function shouldEscalateToSupport(content, context = {}) {
  const lowerContent = content.toLowerCase();
  
  // Frustration indicators
  const frustrationKeywords = [
    'not working',
    'doesn\'t work',
    'broken',
    'frustrated',
    'help me',
    'urgent',
    'emergency',
    'stuck',
    'error',
    'issue',
    'problem',
    'bug',
  ];

  // Request for human help
  const humanRequestKeywords = [
    'speak to',
    'talk to',
    'contact',
    'support',
    'representative',
    'human',
    'person',
    'agent',
  ];

  const hasFrustration = frustrationKeywords.some(kw => lowerContent.includes(kw));
  const requestsHuman = humanRequestKeywords.some(kw => lowerContent.includes(kw));
  const isRepeatedQuestion = context.messageCount > 5 && context.lastThreeMessagesSimilar;

  let shouldEscalate = false;
  let reason = null;
  let suggestedCategory = 'GENERAL';
  let suggestedPriority = 'MEDIUM';

  if (requestsHuman) {
    shouldEscalate = true;
    reason = 'User explicitly requested human support';
    suggestedPriority = 'HIGH';
  } else if (hasFrustration && isRepeatedQuestion) {
    shouldEscalate = true;
    reason = 'User showing frustration with repeated similar questions';
    suggestedPriority = 'HIGH';
  } else if (isRepeatedQuestion) {
    shouldEscalate = true;
    reason = 'Multiple similar questions suggest user needs additional help';
    suggestedPriority = 'MEDIUM';
  }

  // Determine category based on keywords
  if (lowerContent.includes('bug') || lowerContent.includes('error')) {
    suggestedCategory = 'BUG';
  } else if (lowerContent.includes('technical') || lowerContent.includes('not working')) {
    suggestedCategory = 'TECHNICAL';
  } else if (lowerContent.includes('feature') || lowerContent.includes('suggestion')) {
    suggestedCategory = 'FEATURE';
  }

  return {
    shouldEscalate,
    reason,
    suggestedCategory,
    suggestedPriority,
    confidence: shouldEscalate ? 0.8 : 0.2
  };
}

/**
 * Get suggested support message for NOVA to offer help
 * 
 * @param {object} escalation - Escalation recommendation
 * @returns {string} Suggested message
 */
function getSupportOfferMessage(escalation) {
  if (escalation.shouldEscalate) {
    return 'I understand you\'re looking for additional help. Would you like me to create a support ticket for you? Our support team can provide more personalized assistance.';
  }
  return null;
}

module.exports = {
  createSupportTicket,
  shouldEscalateToSupport,
  getSupportOfferMessage,
};
