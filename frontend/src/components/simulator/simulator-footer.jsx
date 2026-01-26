"use client"

import { useState, useEffect } from "react"
import { Clock, Lightbulb, Orbit, Radio, HelpCircle, Activity, Terminal } from "lucide-react"
import { useSimulatorState } from "@/contexts/SimulatorStateContext"

export function SimulatorFooter({ 
  missionTime,
  hintsUsed = 2,
  totalHints = 5,
  orbitStatus = "Analyzing"
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  // Use simulator state for connection status and command count
  const { 
    connected, 
    commands, 
    sessionStartTime,
    missionStarted
  } = useSimulatorState()
  
  // Calculate elapsed time from session start
  useEffect(() => {
    if (!missionStarted || !sessionStartTime) {
      setElapsedSeconds(0)
      return
    }
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [sessionStartTime, missionStarted])

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const commStatusColor = connected ? "text-status-nominal" : "text-status-critical"
  const commStatusLabel = connected ? "Connected" : "Disconnected"

  return (
    <footer className="border-t border-border px-6 py-3 bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Mission Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Mission Time:</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          
          {/* Commands Executed */}
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Commands:</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {commands.length}
            </span>
          </div>
          
          {/* Hints */}
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-status-warning" />
            <span className="text-xs text-muted-foreground">Hints Used:</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {hintsUsed} / {totalHints}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Orbit Status */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Orbit Status:</span>
            <span className="text-sm font-semibold text-foreground">
              {orbitStatus}
            </span>
          </div>
          
          {/* WebSocket Connection Status */}
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${commStatusColor}`} />
            <span className="text-xs text-muted-foreground">WS Connection:</span>
            <span className={`text-sm font-semibold ${commStatusColor}`}>
              {commStatusLabel}
            </span>
          </div>

          {/* Help button */}
          <button 
            className="w-8 h-8 rounded-full border border-border bg-card hover:bg-primary/10 hover:border-primary transition-colors flex items-center justify-center"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </footer>
  )
}
