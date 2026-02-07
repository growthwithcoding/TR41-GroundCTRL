import { useState, useCallback, useEffect, useRef } from "react"
import { Bot, Sparkles, Lightbulb, HelpCircle, Send, Loader2, LogIn, Rocket, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { auth } from "@/lib/firebase/config"
import { SupportTicketModal } from "@/components/support/SupportTicketModal"

/**
 * Unified NOVA Assistant Component
 * Adapts based on authentication status and session presence
 * 
 * Modes:
 * 1. Authenticated + Session: Full training mode
 * 2. Authenticated, No Session: Enhanced help mode
 * 3. Not Authenticated: Public help mode
 */

const NOVA_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/ai/nova/chat`

export function NovaAssistant({ 
  sessionId, 
  stepId,
  context = "help",
  showAuthPrompt = true,
  className = "" 
}) {
  const { user } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [novaContext, setNovaContext] = useState(null)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showSupportButton, setShowSupportButton] = useState(false)
  const messagesEndRef = useRef(null)

  // Determine mode
  const isAuthenticated = !!user
  const hasActiveSession = isAuthenticated && !!sessionId
  const mode = hasActiveSession ? 'TRAINING' : isAuthenticated ? 'AUTH_HELP' : 'PUBLIC_HELP'

  // Load conversation ID from localStorage for anonymous users
  useEffect(() => {
    if (!isAuthenticated && !conversationId) {
      const saved = localStorage.getItem('nova_conversation_id')
      if (saved) {
        setConversationId(saved)
      }
    }
  }, [isAuthenticated, conversationId])

  // Initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      let greeting
      if (mode === 'TRAINING') {
        greeting = {
          id: "welcome-1",
          type: "assistant",
          content: "🚀 Hello! I'm NOVA, your AI assistant for this training mission. I'm here to help you understand satellite operations and guide you through your objectives. What would you like to know?",
          timestamp: new Date().toISOString()
        }
      } else if (mode === 'AUTH_HELP') {
        greeting = {
          id: "welcome-1",
          type: "assistant",
          content: `🛰️ Welcome back, ${user?.displayName || 'Operator'}! I'm NOVA, your AI assistant. I can help you with satellite operations questions, recommend training scenarios, or assist with any ground control topics. How can I help you today?`,
          timestamp: new Date().toISOString()
        }
      } else {
        greeting = {
          id: "welcome-1",
          type: "assistant",
          content: "👋 Hi! I'm NOVA, your AI assistant for satellite ground control. I can help answer questions about satellite operations, ground control systems, and more. Feel free to ask me anything!",
          timestamp: new Date().toISOString()
        }
      }
      setMessages([greeting])
    }
  }, [mode, user, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async (messageOverride) => {
    const messageToSend = messageOverride || inputValue.trim()
    if (!messageToSend || isLoading) return
    
    const newUserMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: messageToSend,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, newUserMessage])
    if (!messageOverride) setInputValue("")
    setIsLoading(true)
    
    try {
      // Prepare request payload
      const payload = {
        content: messageToSend,
      }

      // Add session-specific fields for training mode
      if (hasActiveSession) {
        payload.sessionId = sessionId
        if (stepId) payload.stepId = stepId
      }

      // Add conversation ID for help modes
      if (!hasActiveSession && conversationId) {
        payload.conversationId = conversationId
      }

      // Add context hint if provided
      if (context) {
        payload.context = context
      }

      // Get auth token if authenticated
      let headers = {
        "Content-Type": "application/json",
      }

      if (isAuthenticated) {
        try {
          const currentUser = auth.currentUser
          if (currentUser) {
            const firebaseToken = await currentUser.getIdToken()
            
            // Exchange Firebase token for backend JWT
            const exchangeResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/auth/exchange-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ firebaseToken })
            })
            
            if (exchangeResponse.ok) {
              const exchangeData = await exchangeResponse.json()
              const backendToken = exchangeData.payload?.data?.accessToken
              
              if (backendToken) {
                headers.Authorization = `Bearer ${backendToken}`
              }
            } else {
              console.warn('Token exchange failed:', exchangeResponse.status)
            }
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error)
        }
      }

      // Call unified NOVA endpoint
      const response = await fetch(NOVA_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      // DEBUG: Console log to see response structure
      console.log('🚀 NOVA Response:', JSON.stringify(data, null, 2))
      
      // Extract response from Mission Control envelope
      const messageData = data?.payload?.data?.message
      const messageContent = messageData?.content
      const paragraphs = messageData?.paragraphs || []
      const clarification = messageData?.clarification || null // Get structured clarification
      const responseContext = data?.payload?.data?.context
      const newConversationId = data?.payload?.data?.conversation_id
      
      // Save conversation ID for anonymous users
      if (!isAuthenticated && newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId)
        localStorage.setItem('nova_conversation_id', newConversationId)
      }

      // Save context information
      if (responseContext) {
        setNovaContext(responseContext)
      }

      // Create multiple message bubbles from paragraphs with intelligent timing
      const timestamp = new Date().toISOString()
      const contentToUse = paragraphs.length > 0 ? paragraphs : [messageContent || "I'm sorry, I couldn't process that request."]
      
      /**
       * Calculate reading time based on content length
       * Average reading: ~250 words/min = ~4 words/sec = ~250ms per word
       * Plus base typing time of 800-1500ms
       */
      const calculateDelay = (previousContent, currentContent) => {
        if (!previousContent) return 100 // First bubble: appear immediately (tiny delay for smooth animation)
        
        // Calculate reading time for previous bubble
        const wordCount = previousContent.split(/\s+/).length
        const readingTime = Math.min(wordCount * 250, 3000) // Cap at 3 seconds
        
        // Calculate typing time for current bubble (50-80ms per char, capped)
        const typingTime = Math.min(currentContent.length * 60, 1500) // Cap at 1.5 seconds
        
        return readingTime + typingTime
      }
      
      // Add bubbles one at a time with intelligent delays and typing indicators
      let cumulativeDelay = 0
      
      contentToUse.forEach((para, idx) => {
        const previousContent = idx > 0 ? contentToUse[idx - 1] : null
        const delay = calculateDelay(previousContent, para)
        cumulativeDelay += delay
        
        // Show typing indicator before bubble appears
        if (idx > 0) {
          const typingDelay = cumulativeDelay - Math.min(para.length * 60, 1500)
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `typing-${Date.now()}`,
              type: "typing",
              content: "",
              timestamp: ""
            }])
          }, typingDelay)
        }
        
        // Show actual bubble and remove typing indicator
        setTimeout(() => {
          setMessages(prev => {
            // Remove typing indicator if present
            const filtered = prev.filter(m => m.type !== "typing")
            
            // Add new bubble
            const bubble = {
              id: `assistant-${Date.now()}-${idx}`,
              type: "assistant",
              content: para,
              timestamp: idx === contentToUse.length - 1 ? timestamp : '', // Only show timestamp on last bubble
              context: idx === contentToUse.length - 1 ? responseContext : null, // Only attach context to last bubble
              clarification: idx === contentToUse.length - 1 ? clarification : null // Attach clarification to last bubble
            }
            
            return [...filtered, bubble]
          })
        }, cumulativeDelay)
      })

      // Show auth benefits hint for anonymous users occasionally
      if (!isAuthenticated && responseContext?.auth_benefits && Math.random() < 0.3) {
        setTimeout(() => {
          const benefitsMessage = {
            id: `hint-${Date.now()}`,
            type: "system",
            content: "💡 Sign in to unlock personalized training scenarios and track your progress!",
            timestamp: new Date().toISOString()
          }
          setMessages(prev => [...prev, benefitsMessage])
        }, 1000)
      }

      // Detect frustration indicators - show support button
      const userMessages = messages.filter(m => m.type === "user")
      const lowerContent = messageToSend.toLowerCase()
      const frustrationKeywords = ['not working', 'doesn\'t work', 'broken', 'frustrated', 'help me', 'urgent', 'stuck', 'error', 'issue', 'problem']
      const supportKeywords = ['speak to', 'talk to', 'contact', 'support', 'representative', 'human', 'person', 'agent']
      
      const hasFrustration = frustrationKeywords.some(kw => lowerContent.includes(kw))
      const requestsSupport = supportKeywords.some(kw => lowerContent.includes(kw))
      const hasMultipleMessages = userMessages.length >= 4
      
      if ((hasFrustration && hasMultipleMessages) || requestsSupport) {
        setShowSupportButton(true)
      }

    } catch (err) {
      console.error('NOVA API Error:', err)
      const fallbackMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: "I'm experiencing some connectivity issues. Please try again in a moment, or check the help articles for immediate assistance.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, stepId, conversationId, isAuthenticated, hasActiveSession, context])

  // Quick action buttons based on mode
  const quickActions = mode === 'TRAINING' ? [
    { label: "Explain", icon: HelpCircle, prompt: "Can you explain the current objective?" },
    { label: "Hint", icon: Lightbulb, prompt: "Can you give me a hint?" },
  ] : [
    { label: "Getting Started", icon: Rocket, prompt: "How do I get started with satellite ground control?" },
    { label: "Help Articles", icon: HelpCircle, prompt: "Show me relevant help articles" },
  ]

  // Get mode-specific title
  const getModeTitle = () => {
    return 'Navigational Orbital Vector Assistant'
  }

  // Get capabilities from context
  const capabilities = novaContext?.capabilities || []
  const suggestion = novaContext?.suggestion
  const authBenefits = novaContext?.auth_benefits || []

  return (
    <aside className={`w-80 border-r border-border flex flex-col bg-card self-stretch overflow-hidden ${className}`}>
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
            <span className="text-xs text-muted-foreground">{getModeTitle()}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-status-nominal/10 border border-status-nominal/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-nominal animate-pulse" />
            <span className="text-[10px] font-medium text-status-nominal">ONLINE</span>
          </div>
        </div>

        {/* Mode indicator */}
        {mode === 'TRAINING' && (
          <Badge variant="outline" className="mt-2 text-xs">
            <Rocket className="w-3 h-3 mr-1" />
            Training Mode
          </Badge>
        )}
        {mode === 'PUBLIC_HELP' && showAuthPrompt && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full text-xs"
            onClick={() => window.location.href = '/login'}
          >
            <LogIn className="w-3 h-3 mr-1" />
            Sign in for personalized help
          </Button>
        )}
      </div>
      
      {/* Capabilities & Suggestions */}
      {(suggestion || capabilities.length > 0) && (
        <div className="p-3 border-b border-border bg-muted/30">
          {suggestion && (
            <Alert className="mb-2 py-2">
              <AlertDescription className="text-xs">
                💡 {suggestion}
              </AlertDescription>
            </Alert>
          )}
          {capabilities.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">I can help with:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {capabilities.slice(0, 3).map((cap, i) => (
                  <li key={i}>{cap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-0.5 ${
              message.type === "user" 
                ? "items-end" 
                : message.type === "system"
                ? "items-center"
                : "items-start"
            }`}
          >
            {message.type === "typing" ? (
              /* Typing indicator */
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></span>
                </div>
              </div>
            ) : (
              /* Regular message bubble */
              <>
                <div className={`p-2.5 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.type === "system"
                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20 text-center"
                    : "bg-primary/10 text-foreground border border-primary/20"
                }`}>
                  {message.content}
                </div>
                
                {/* Clarification Buttons */}
                {message.clarification && message.clarification.options && message.clarification.options.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 max-w-[85%]">
                    {message.clarification.options.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(option.text)}
                        className="w-full justify-start text-left bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium"
                      >
                        {option.text}
                      </Button>
                    ))}
                  </div>
                )}
                
                {message.timestamp && (
                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="p-2.5 rounded-lg text-xs bg-primary/10 text-foreground border border-primary/20 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">NOVA is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border space-y-2 bg-muted/30">
        {/* Quick actions */}
        <div className="flex gap-1.5">
          {quickActions.map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              size="sm" 
              disabled={isLoading}
              onClick={() => handleSend(action.prompt)}
              className="flex-1 rounded-md text-[10px] h-7 bg-transparent gap-1 px-2"
            >
              <action.icon className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Input form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative"
        >
          <Input
            placeholder={
              mode === 'TRAINING' 
                ? "Ask about your mission..." 
                : "Ask NOVA anything..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="pr-10 rounded-lg bg-card text-xs h-11"
          />
          <Button 
            type="submit"
            size="icon" 
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>

        {/* Support button - shown when frustration detected */}
        {showSupportButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs gap-2 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
            onClick={() => setShowSupportModal(true)}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Need Extra Help? Create Support Ticket
          </Button>
        )}

        {/* Auth benefits for anonymous users */}
        {!isAuthenticated && authBenefits.length > 0 && (
          <div className="text-xs text-muted-foreground bg-blue-500/5 rounded-lg p-2 border border-blue-500/10">
            <div className="font-medium text-blue-600 mb-1">🔓 Sign in to unlock:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {authBenefits.slice(0, 3).map((benefit, i) => (
                <li key={i}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal 
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        conversationId={conversationId}
        prefilledSubject="Need help with satellite operations"
        prefilledContent={messages.filter(m => m.type === 'user').slice(-3).map(m => m.content).join('\n\n')}
      />
    </aside>
  )
}
