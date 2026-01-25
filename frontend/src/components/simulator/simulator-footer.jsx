"use client"

import { useState, useEffect } from "react"
import { Clock, Lightbulb, Orbit, Radio, HelpCircle, Activity } from "lucide-react"

export function SimulatorFooter({ 
  missionTime,
  hintsUsed = 2,
  totalHints = 5,
  orbitStatus = "Analyzing",
  commStatus = "connected"
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(754) // Start at 12:34
  
  // Simulate mission timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const commStatusColor = {
    connected: "text-status-nominal",
    intermittent: "text-status-warning",
    disconnected: "text-status-critical"
  }

  const commStatusLabel = {
    connected: "Connected",
    intermittent: "Intermittent",
    disconnected: "No Signal"
  }

  return (
    <footer className="border-t border-border px-6 py-3 bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Mission Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Mission Time: 00:00</span>
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
          
          {/* Comm Link */}
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${commStatusColor[commStatus]}`} />
            <span className="text-xs text-muted-foreground">Comm Link:</span>
            <span className={`text-sm font-semibold ${commStatusColor[commStatus]}`}>
              {commStatusLabel[commStatus]}
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
