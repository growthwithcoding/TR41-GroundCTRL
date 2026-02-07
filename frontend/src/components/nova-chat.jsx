"use client"

import React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Bot, Sparkles, Send, HelpCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const NOVA_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/ai/chat`

/**
 * Fallback responses when API is unavailable
 */
const fallbackResponses = {
  help: [
    "I can help you find articles about that topic. Try browsing the categories on the right, or use the search bar above.",
    "That's a great question! Check out the 'Getting Started' category for beginner tutorials.",
    "For detailed information about satellite operations, I recommend the 'Satellite Operations' category.",
    "If you need hands-on practice, head to the Simulator to try guided missions with real-time feedback.",
    "You can find mission walkthroughs in the 'Missions' section of the Help Center.",
  ],
  simulator: [
    "Check the telemetry panel on the right for current satellite status.",
    "Use the Command Console to execute maneuvers when you're ready.",
    "Remember to monitor your fuel levels before any orbital adjustments.",
    "The current objective is displayed in the mission panel. Focus on completing each step in order.",
    "If you're unsure about a command, hover over it for more details.",
  ]
}

const getFallbackResponse = (context) => {
  const responses = fallbackResponses[context]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Split message content into paragraphs for multi-bubble rendering
 * Uses double line breaks as semantic paragraph boundaries
 */
const splitMessageIntoParagraphs = (content) => {
  if (!content || typeof content !== 'string') return []
  
  return content
    .split(/\n\s*\n/) // Break on double newlines (paragraph separators)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

/**
 * No longer needed - clarification now comes structured from backend
 * Keeping as placeholder for backwards compatibility
 */
const extractClarifyingQuestions = () => {
  return []
}

/**
 * Suggestion Buttons Component
 * Renders context-aware action buttons below NOVA's last message
 */
function NovaSuggestions({ suggestions, onSelect, isVisible }) {
  if (!suggestions || suggestions.length === 0 || !isVisible) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-primary/20">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion.action)}
          className="rounded-full bg-primary/5 border border-primary/30 hover:bg-primary/10 
                     px-3 py-1.5 text-xs text-primary transition-colors duration-200 
                     hover:border-primary/50 active:bg-primary/20 flex items-center gap-1.5"
          title={suggestion.action}
        >
          <HelpCircle className="h-3 w-3 shrink-0" />
          <span>{suggestion.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Clarifying Questions Component
 * Displays questions from NOVA as clickable buttons for quick responses
 */
function ClarifyingQuestions({ questions, onSelect }) {
  if (!questions || questions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {questions.map((question) => (
        <button
          key={question.id}
          onClick={() => onSelect(question.action)}
          className="rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 
                     px-4 py-2 text-sm text-blue-600 dark:text-blue-400 transition-colors duration-200 
                     hover:border-blue-500/50 active:bg-blue-500/30 font-medium"
        >
          {question.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Individual Message Bubble
 * Renders single paragraph with staggered animation
 * Includes clarifying questions if detected
 */
function MessageBubble({ content, type, timestamp, index, clarifyingQuestions, onClarify }) {
  return (
    <div
      className={`flex flex-col gap-1 ${type === "user" ? "items-end" : "items-start"} 
                   animate-in fade-in slide-in-from-bottom-1`}
      style={{ 
        animationDelay: `${index * 50}ms`,
        animationDuration: '300ms'
      }}
    >
      <div
        className={`p-3 rounded-lg max-w-[85%] text-sm ${
          type === "user"
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-primary/10 text-foreground border border-primary/20 rounded-bl-none"
        }`}
      >
        {content}
      </div>
      {clarifyingQuestions && clarifyingQuestions.length > 0 && (
        <div className="max-w-[85%]">
          <ClarifyingQuestions questions={clarifyingQuestions} onSelect={onClarify} />
        </div>
      )}
      <span className="text-xs text-muted-foreground px-1">
        {timestamp}
      </span>
    </div>
  )
}

/**
 * Main NovaChat Component
 * Props:
 *   - sessionId: string - Current session ID for backend tracking
 *   - stepId: string - Current step ID (for simulator context)
 *   - context: 'help' | 'simulator' - Determines which suggestions are shown
 *   - articleSlug: string - Article slug for auto-generating TL;DR
 *   - className: string - Additional CSS classes
 */
export function NovaChat({ 
  sessionId, 
  stepId, 
  context = "help",
  articleSlug,
  className = "" 
}) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize with welcome message or auto-generate TL;DR for article
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    
    // If articleSlug is provided, auto-request TL;DR
    if (articleSlug) {
      const loadingMessage = {
        id: 'loading-tldr',
        type: 'assistant',
        content: 'Let me generate a quick summary of this article for you...',
        timestamp: timestamp
      }
      setMessages([loadingMessage])
      setIsLoading(true)
      
      // Auto-request TL;DR
      const requestTLDR = async () => {
        try {
          const response = await fetch(NOVA_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: "Please provide a brief TL;DR summary of this help article in 2-3 sentences, highlighting the key points.",
              context: 'help',
              articleSlug: articleSlug,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            const messageData = data.payload?.data?.message
            const suggestionsData = data.payload?.data?.suggestions || []
            const newConversationId = data.payload?.data?.conversationId
            
            if (newConversationId) {
              setConversationId(newConversationId)
            }
            
            const paragraphs = messageData?.paragraphs || splitMessageIntoParagraphs(messageData?.content || "")
            const newTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
            
            const tldrMessages = paragraphs.map((para, idx) => ({
              id: `tldr-${idx}`,
              type: "assistant",
              content: para,
              timestamp: idx === paragraphs.length - 1 ? newTimestamp : ''
            }))
            
            setMessages(tldrMessages)
            
            if (suggestionsData.length > 0) {
              setSuggestions(suggestionsData)
              setShowSuggestions(true)
            } else {
              // Default article suggestions
              setSuggestions([
                { id: 'explain', label: 'Explain more', action: 'Can you explain this in more detail?' },
                { id: 'related', label: 'Related topics', action: 'What other related topics should I know?' }
              ])
              setShowSuggestions(true)
            }
          } else {
            throw new Error('Failed to generate TL;DR')
          }
        } catch (error) {
          console.error('TL;DR generation failed:', error)
          // Fallback to generic welcome
          const welcomeMessage = "Hi! I'm NOVA. I can help explain this article, answer questions, or point you to related topics. What would you like to know?"
          const welcomeParagraphs = splitMessageIntoParagraphs(welcomeMessage)
          const fallbackMessages = welcomeParagraphs.map((para, idx) => ({
            id: `welcome-${idx}`,
            type: "assistant",
            content: para,
            timestamp: idx === welcomeParagraphs.length - 1 ? timestamp : ''
          }))
          setMessages(fallbackMessages)
          setSuggestions([
            { id: 'explain', label: 'Explain more', action: 'Can you explain this in more detail?' },
            { id: 'search', label: 'Search articles', action: 'How do I search the help articles?' }
          ])
          setShowSuggestions(true)
        } finally {
          setIsLoading(false)
        }
      }
      
      requestTLDR()
    } else {
      // Regular welcome message
      const welcomeMessage = context === "simulator"
        ? "Welcome! I'm NOVA, your mission guide. I'm here to help you complete this training scenario. Ask me anything about the current objective or commands."
        : "Hi! I'm NOVA, your GroundCTRL assistant. I can help you navigate the Help Center, explain satellite concepts, or answer questions about missions. How can I assist you today?"
      
      const welcomeParagraphs = splitMessageIntoParagraphs(welcomeMessage)
      const initialMessages = welcomeParagraphs.map((para, idx) => ({
        id: `welcome-${idx}`,
        type: "assistant",
        content: para,
        timestamp: idx === 0 ? timestamp : ''
      }))
      
      setMessages(initialMessages)
      
      // Set initial suggestions
      const initialSuggestions = context === "simulator" 
        ? [
            { id: 'hint', label: 'Get a hint', action: 'Can you give me a hint for this objective?' },
            { id: 'explain', label: 'Explain objective', action: 'Explain what I need to do in this step' }
          ]
        : [
            { id: 'modules', label: 'Show training modules', action: 'List all available training modules for me' },
            { id: 'search', label: 'Search articles', action: 'How do I search the help articles?' }
          ]
      
      setSuggestions(initialSuggestions)
      setShowSuggestions(true)
    }
  }, [context, articleSlug])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessageContent = inputValue.trim()
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: userMessageContent,
      timestamp: timestamp
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setShowSuggestions(false)
    
    try {
      // POST to NOVA chat API
      const response = await fetch(NOVA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: userMessageContent,
          context: context,
          conversationId: conversationId,
          sessionId: sessionId,
          stepId: stepId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // DEBUG: Log the full response to see structure
      console.log('NOVA Response:', JSON.stringify(data, null, 2))
      
      // Extract response from envelope structure
      const messageData = data.payload?.data?.message
      const suggestionsData = data.payload?.data?.suggestions || []
      const newConversationId = data.payload?.data?.conversation_id
      
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId)
      }
      
      // Use paragraphs if available, otherwise split content
      const paragraphs = messageData?.paragraphs || splitMessageIntoParagraphs(messageData?.content || "I'm sorry, I couldn't process that request.")
      
      // Get structured clarification from backend (if any)
      const clarification = messageData?.clarification || null
      
      const newTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      
      // Create multiple message bubbles from paragraphs
      // Only attach clarification to the LAST bubble
      const assistantMessages = paragraphs.map((para, idx) => {
        const isLastBubble = idx === paragraphs.length - 1
        
        // Convert backend clarification format to frontend format
        let clarifyingQuestions = null
        if (isLastBubble && clarification && clarification.options) {
          clarifyingQuestions = clarification.options.map(opt => ({
            id: opt.id,
            label: opt.text,
            action: opt.text
          }))
        }
        
        return {
          id: `assistant-${Date.now()}-${idx}`,
          type: "assistant",
          content: para,
          timestamp: isLastBubble ? newTimestamp : '',
          clarifyingQuestions: clarifyingQuestions
        }
      })
      
      setMessages(prev => [...prev, ...assistantMessages])
      
      // Update suggestions
      if (suggestionsData.length > 0) {
        setSuggestions(suggestionsData)
        setShowSuggestions(true)
      }
      
    } catch (err) {
      console.error('NOVA API error:', err)
      
      // Use fallback response when API is unavailable
      const fallbackContent = getFallbackResponse(context)
      const fallbackParagraphs = splitMessageIntoParagraphs(fallbackContent)
      const fallbackTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      
      const fallbackMessages = fallbackParagraphs.map((para, idx) => ({
        id: `assistant-fallback-${Date.now()}-${idx}`,
        type: "assistant",
        content: para,
        timestamp: idx === fallbackParagraphs.length - 1 ? fallbackTimestamp : ''
      }))
      
      setMessages(prev => [...prev, ...fallbackMessages])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, stepId, context, conversationId])

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (action) => {
    setInputValue(action)
    // Optionally auto-send the suggestion
    setTimeout(() => {
      setInputValue(action)
      // Focus the input so user can modify if needed before sending
      document.querySelector('input[placeholder*="Ask"]')?.focus()
    }, 0)
  }

  const handleClarifyClick = (answer) => {
    // Auto-send clarifying answers immediately
    setInputValue(answer)
    setTimeout(() => {
      // Trigger send
      const sendButton = document.querySelector('button[type="submit"]')
      if (sendButton && !sendButton.disabled) {
        sendButton.click()
      }
    }, 100)
  }

  return (
    <aside className={`w-80 border-r border-border flex flex-col bg-card ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">NOVA</span>
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
              Navigational Orbital Vector Assistant
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            type={message.type}
            timestamp={message.timestamp}
            index={index}
            clarifyingQuestions={message.clarifyingQuestions}
            onClarify={handleClarifyClick}
          />
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="p-3 rounded-lg text-sm bg-primary/10 text-foreground border border-primary/20 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">NOVA is thinking...</span>
            </div>
          </div>
        )}
        
        {/* Suggestions after last message */}
        {!isLoading && (
          <NovaSuggestions
            suggestions={suggestions}
            onSelect={handleSuggestionClick}
            isVisible={showSuggestions}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border space-y-3 bg-muted/30">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative"
        >
          <Input
            placeholder={context === "help" ? "Ask NOVA anything..." : "Ask how or why..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="pr-10 rounded-lg bg-card"
          />
          <Button 
            type="submit"
            size="icon" 
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>
      </div>
    </aside>
  )
}
