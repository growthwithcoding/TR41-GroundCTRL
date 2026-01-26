"use client"

import { useState, useCallback, useEffect } from "react"
import { Bot, Sparkles, Lightbulb, HelpCircle, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSimulatorState } from "@/contexts/SimulatorStateContext"

// API endpoint for NOVA chat
const NOVA_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/nova/chat`

// Fallback responses when API is unavailable
const fallbackResponses = [
  "Check the telemetry panel on the right for current satellite status and orbital parameters.",
  "Use the Command Console to execute maneuvers. Type 'help' to see available commands.",
  "Remember to monitor your fuel levels before any orbital adjustments.",
  "The current objective is displayed in the mission panel. Complete each step to progress.",
  "Your satellite's position is shown on the ground track map. Watch for coverage areas.",
  "For orbital maneuvers, consider the delta-v required and your remaining propellant.",
  "The mission timer shows elapsed time. Some objectives may have time constraints.",
]

const getFallbackResponse = () => {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
}

export function NovaAssistant({ sessionId, stepId }) {
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: "intro-1",
      type: "assistant",
      content: "Hello I'm Nova, your AI assistant. I'm here to help you understand satellite operations and guide you through your missions. What would you like to learn about?"
    }
  ])
  
  // Use simulator state for step guidance
  const { 
    steps, 
    currentStepIndex,
    missionProgress 
  } = useSimulatorState()
  
  // Add guidance message when step changes
  useEffect(() => {
    const currentStep = steps[currentStepIndex]
    if (currentStep && !currentStep.completed && currentStep.text) {
      const stepGuidanceMessage = {
        id: `step-guidance-${currentStep.id}`,
        type: "assistant",
        content: `📍 Current objective: ${currentStep.text}${currentStep.requiredCommands?.length > 0 ? ` (Required commands: ${currentStep.requiredCommands.join(', ')})` : ''}`
      }
      
      // Only add if not already present
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === stepGuidanceMessage.id)
        if (!exists) {
          return [...prev, stepGuidanceMessage]
        }
        return prev
      })
    }
  }, [currentStepIndex, steps])

  const quickActions = [
    { label: "Explain", icon: HelpCircle, prompt: "Can you explain the current command?" },
    { label: "Next step", icon: Lightbulb, prompt: "What should I do next?" },
  ]

  const handleSend = useCallback(async (messageOverride) => {
    const messageToSend = messageOverride || inputValue.trim()
    if (!messageToSend || isLoading) return
    
    const newUserMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: messageToSend
    }
    
    setMessages(prev => [...prev, newUserMessage])
    if (!messageOverride) setInputValue("")
    setIsLoading(true)
    
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
          message: messageToSend,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      const novaResponse = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: data.replyText || "I'm sorry, I couldn't process that request."
      }
      setMessages(prev => [...prev, novaResponse])
    } catch (err) {
      // Use fallback response when API is unavailable
      const fallbackMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: getFallbackResponse()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, stepId])

  return (
    <aside className="w-72 shrink-0 border-r border-border flex flex-col bg-card overflow-hidden">
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
            <span className="text-xs text-muted-foreground">AI Assistant</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-status-nominal/10 border border-status-nominal/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-nominal animate-pulse" />
            <span className="text-[10px] font-medium text-status-nominal">ONLINE</span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`p-3 rounded-lg max-w-[85%] text-sm ${
              message.type === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-foreground border border-primary/20"
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg text-sm bg-primary/10 text-foreground border border-primary/20 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">Thinking...</span>
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
            placeholder="Ask Nova anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="pr-10 rounded-lg bg-card text-sm"
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
        <div className="flex gap-2">
          {quickActions.map((action, i) => (
            <Button 
              key={i}
              variant="outline" 
              size="sm" 
              disabled={isLoading}
              onClick={() => handleSend(action.prompt)}
              className="flex-1 rounded-lg text-xs bg-transparent gap-1.5"
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  )
}
