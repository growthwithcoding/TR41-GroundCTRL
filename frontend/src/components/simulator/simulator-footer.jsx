"use client"

import { useState, useEffect } from "react"
import { Clock, Lightbulb, Orbit, Radio, HelpCircle, Activity, Terminal } from "lucide-react"
import { useSimulatorState } from "@/contexts/SimulatorStateContext"
import { api, getBackendAccessToken } from "@/lib/api/httpClient"

export function SimulatorFooter({ 
  missionStarted,
  sessionId,
  satellite
}) {
  const [hintsUsed, setHintsUsed] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  // Use simulator state for connection status and command count
  const { 
    connected, 
    commands, 
    sessionStartTime,
    telemetry,
    scenario
  } = useSimulatorState()
  
  // Fetch hints used from backend
  useEffect(() => {
    const fetchHints = async () => {
      if (!sessionId) return
      
      // Wait for authentication token before making request
      const token = getBackendAccessToken()
      if (!token) {
        console.log('Waiting for authentication before fetching hint stats...')
        return
      }
      
      try {
        const data = await api.get(`/ai/stats/${sessionId}`)
        setHintsUsed(data.payload?.data?.hint_count || 0)
      } catch (error) {
        // Silently fail - not critical if hints counter doesn't update
        console.debug('Error fetching hint stats:', error.message)
      }
    }
    
    if (missionStarted && sessionId) {
      // Wait a bit for auth to complete before first fetch
      const initialTimeout = setTimeout(fetchHints, 1000)
      
      // Refresh every 10 seconds
      const interval = setInterval(fetchHints, 10000)
      
      return () => {
        clearTimeout(initialTimeout)
        clearInterval(interval)
      }
    }
  }, [sessionId, missionStarted])
  
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
  
  // Get satellite name and scenario max hints
  const satelliteName = satellite?.name || scenario?.satellite?.name || 'Satellite'
  const totalHints = scenario?.maxHints || 5
  const orbitStatus = telemetry?.orbit ? "Nominal" : "Analyzing"

  return (
    <footer className="border-t border-border px-6 py-3 bg-muted/50 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6 flex-wrap">
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
          
          {/* Satellite Name */}
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Satellite:</span>
            <span className="text-sm font-semibold text-foreground">
              {satelliteName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
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
