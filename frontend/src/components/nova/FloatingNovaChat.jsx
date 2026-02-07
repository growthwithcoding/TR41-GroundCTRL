import { useState, useCallback, useEffect, useRef } from "react"
import { Bot, Sparkles, Lightbulb, HelpCircle, Send, Loader2, X, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { auth } from "@/lib/firebase/config"

const NOVA_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/ai/nova/chat`

/**
 * Floating NOVA Chat Component
 * A floating chat button with beaconing animation that expands into a chat panel
 * 
 * Props:
 * - sessionId: string - Current session ID for backend tracking
 * - stepId: string - Current step ID (for simulator context)
 * - context: 'help' | 'simulator' - Determines behavior and suggestions
 * - position: 'left' | 'right' - Position of the floating button (default: 'left')
 * - className: string - Additional CSS classes
 */
export function FloatingNovaChat({ 
  sessionId, 
  stepId,
  context = "help",
  position = "left",
  className = "" 
}) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)

  const isAuthenticated = !!user
  const hasActiveSession = isAuthenticated && !!sessionId

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      let greeting
      if (hasActiveSession) {
        greeting = {
          id: "welcome-1",
          type: "assistant",
          content: "🚀 Hello! I'm NOVA, your AI assistant. I'm here to help you with this training mission. What would you like to know?",
          timestamp: new Date().toISOString()
        }
      } else if (context === 'help') {
        greeting = {
          id: "welcome-1",
          type: "assistant",
          content: "👋 Hi! I'm NOVA, your AI assistant. I can help answer questions about satellite operations and ground control. Feel free to ask me anything!",
          timestamp: new Date().toISOString()
        }
      } else {
        greeting = {
          id: "welcome-1",
          type: "assistant",
          content: "🛰️ Welcome! I'm NOVA, your mission guide. How can I assist you today?",
          timestamp: new Date().toISOString()
        }
      }
      setMessages([greeting])
    }
  }, [context, hasActiveSession, messages.length])

  // Track unread messages when chat is closed or minimized
  useEffect(() => {
    if ((!isOpen || isMinimized) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // Only count assistant messages (not user messages or typing indicators)
      if (lastMessage.type === "assistant" && lastMessage.id && !lastMessage.id.startsWith('welcome')) {
        setUnreadCount(prev => prev + 1)
      }
    }
  }, [messages, isOpen, isMinimized])

  // Reset unread count when chat is opened AND expanded (user can actually see messages)
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0)
    }
  }, [isOpen, isMinimized])

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
      const payload = {
        content: messageToSend,
      }

      if (hasActiveSession) {
        payload.sessionId = sessionId
        if (stepId) payload.stepId = stepId
      }

      if (!hasActiveSession && conversationId) {
        payload.conversationId = conversationId
      }

      if (context) {
        payload.context = context
      }

      let headers = {
        "Content-Type": "application/json",
      }

      if (isAuthenticated) {
        try {
          const currentUser = auth.currentUser
          if (currentUser) {
            const firebaseToken = await currentUser.getIdToken()
            
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
            }
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error)
        }
      }

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
      
      const messageData = data?.payload?.data?.message
      const messageContent = messageData?.content
      const paragraphs = messageData?.paragraphs || []
      const clarification = messageData?.clarification || null
      const newConversationId = data?.payload?.data?.conversation_id
      
      if (!isAuthenticated && newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId)
        localStorage.setItem('nova_conversation_id', newConversationId)
      }

      const timestamp = new Date().toISOString()
      const contentToUse = paragraphs.length > 0 ? paragraphs : [messageContent || "I'm sorry, I couldn't process that request."]
      
      // Add messages with intelligent delays
      let cumulativeDelay = 0
      
      contentToUse.forEach((para, idx) => {
        const delay = idx === 0 ? 100 : 1000 + (para.length * 30)
        cumulativeDelay += delay
        
        if (idx > 0) {
          const typingDelay = cumulativeDelay - Math.min(para.length * 30, 1000)
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `typing-${Date.now()}`,
              type: "typing",
              content: "",
              timestamp: ""
            }])
          }, typingDelay)
        }
        
        setTimeout(() => {
          setMessages(prev => {
            const filtered = prev.filter(m => m.type !== "typing")
            
            const bubble = {
              id: `assistant-${Date.now()}-${idx}`,
              type: "assistant",
              content: para,
              timestamp: idx === contentToUse.length - 1 ? timestamp : '',
              clarification: idx === contentToUse.length - 1 ? clarification : null
            }
            
            return [...filtered, bubble]
          })
        }, cumulativeDelay)
      })

    } catch (err) {
      console.error('NOVA API Error:', err)
      const fallbackMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: "I'm experiencing some connectivity issues. Please try again in a moment.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, stepId, conversationId, isAuthenticated, hasActiveSession, context])

  const quickActions = hasActiveSession ? [
    { label: "Explain", icon: HelpCircle, prompt: "Can you explain the current objective?" },
    { label: "Hint", icon: Lightbulb, prompt: "Can you give me a hint?" },
  ] : [
    { label: "Getting Started", icon: HelpCircle, prompt: "How do I get started?" },
    { label: "Help", icon: Lightbulb, prompt: "What can you help me with?" },
  ]

  const positionClasses = position === "left" 
    ? "left-6 bottom-6" 
    : "right-6 bottom-6"

  const panelPositionClasses = position === "left"
    ? "left-6 bottom-24"
    : "right-6 bottom-24"

  return (
    <>
      {/* Floating Chat Panel */}
      {isOpen && (
        <div 
          className={`fixed ${panelPositionClasses} z-50 w-96 bg-card border border-border rounded-lg shadow-2xl transition-all duration-300 flex flex-col ${
            isMinimized ? 'h-16' : 'h-150'
          } ${className}`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">NOVA</span>
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground truncate block">
                  AI Assistant Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-0.5 ${
                      message.type === "user" 
                        ? "items-end" 
                        : "items-start"
                    }`}
                  >
                    {message.type === "typing" ? (
                      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`p-2.5 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-foreground border border-primary/20"
                        }`}>
                          {message.content}
                        </div>
                        
                        {message.clarification && message.clarification.options && (
                          <div className="flex flex-col gap-2 mt-2 max-w-[85%]">
                            {message.clarification.options.map((option) => (
                              <Button
                                key={option.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSend(option.text)}
                                className="w-full justify-start text-left bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-xs"
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
              <div className="p-4 border-t border-border space-y-3 bg-muted/30">
                {/* Quick actions */}
                <div className="flex gap-2">
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
                    placeholder="Ask NOVA anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="pr-10 rounded-lg bg-card text-xs h-10"
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
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button with Beaconing Animation */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses} z-50 group ${className}`}
          aria-label="Open NOVA Chat"
        >
          {/* Beaconing/Pulsing Rings */}
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
          
          {/* Main Button */}
          <div className="relative w-16 h-16 rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 flex items-center justify-center shadow-lg group-hover:scale-110">
            <Bot className="w-8 h-8 text-primary-foreground" />
            
            {/* Unread Badge */}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            <div className="bg-popover text-popover-foreground text-xs px-3 py-1.5 rounded-md shadow-md border border-border">
              Chat with NOVA
            </div>
          </div>
        </button>
      )}
    </>
  )
}
