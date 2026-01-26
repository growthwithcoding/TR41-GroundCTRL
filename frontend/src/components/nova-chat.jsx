"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Bot, Sparkles, Send, HelpCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// API endpoint for NOVA chat
const NOVA_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/nova/chat`

// Fallback responses when API is unavailable
const fallbackResponses = {
  help: [
    "I can help you find articles about that topic. Try browsing the categories on the right, or use the search bar above.",
    "That's a great question Check out the 'Getting Started' category for beginner tutorials.",
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

const createInitialMessages = (context) => {
  if (context === "simulator") {
    return [
      {
        id: "init-1",
        type: "assistant",
        content: "Welcome I'm here to guide you through this mission. You're currently analyzing the satellite's orbit. Notice the perigee altitude in the center display.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }
    ]
  }
  return [
    {
      id: "init-help",
      type: "assistant",
      content: "Hi I'm Nova, your GroundCTRL assistant. I can help you navigate the Help Center, explain satellite concepts, or answer questions about missions.",
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    },
  ]
}

export function NovaChat({ sessionId, stepId, context = "help", className = "" }) {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState(() => createInitialMessages(context))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessageContent = inputValue.trim()
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setError(null)
    
    try {
      // POST to NOVA chat API at https://api.missionctrl.org/api/v1/nova/chat
      const response = await fetch(NOVA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          stepId,
          message: userMessageContent,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: data.replyText || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      // Use fallback response when API is unavailable
      const fallbackMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: getFallbackResponse(context),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, stepId])

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = context === "help" 
    ? [
        { label: "Search articles", action: "How do I search for help articles?" },
        { label: "Start tutorial", action: "What's the best beginner tutorial?" },
      ]
    : [
        { label: "Need a hint?", action: "Can you give me a hint for this objective?" },
        { label: "Explain objective", action: "Explain the current mission objective." },
      ]

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
              <span className="text-sm font-semibold text-foreground">Nova</span>
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
              {context === "help" ? "Help Center Assistant" : "Mission Guide"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-1 ${message.type === "user" ? "items-end" : "items-start"}`}
          >
            <div className={`p-3 rounded-lg max-w-[85%] text-sm ${
              message.type === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-foreground border border-primary/20"
            }`}>
              {message.content}
            </div>
            <span className="text-xs text-muted-foreground px-1">
              {message.timestamp}
            </span>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="p-3 rounded-lg text-sm bg-primary/10 text-foreground border border-primary/20 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">Nova is thinking...</span>
            </div>
          </div>
        )}
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
            placeholder={context === "help" ? "Ask Nova anything..." : "Ask how or why..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
        <div className="flex items-center gap-2">
          {quickActions.map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              size="sm" 
              onClick={() => {
                setInputValue(action.action)
              }}
              className="rounded-lg text-xs bg-transparent flex-1 gap-1.5"
            >
              <HelpCircle className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  )
}
