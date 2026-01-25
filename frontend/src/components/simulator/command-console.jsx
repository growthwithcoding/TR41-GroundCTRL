"use client"

import React, { useState } from "react"
import { 
  Rocket, 
  Navigation, 
  Radio, 
  ChevronRight, 
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  RotateCcw,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"

import { simulateCommandExecution } from "@/lib/simulator-state"

const commands = [
  {
    id: "raise-perigee",
    icon: <Rocket className="w-4 h-4" />,
    title: "RAISE PERIGEE",
    subtitle: "Target: 400km",
    category: "orbital"
  },
  {
    id: "station-keeping",
    icon: <RotateCcw className="w-4 h-4" />,
    title: "STATION KEEPING",
    subtitle: "Maintain position",
    category: "orbital"
  },
  {
    id: "orient-nadir",
    icon: <Navigation className="w-4 h-4" />,
    title: "ORIENT TO NADIR",
    subtitle: "Point to Earth",
    category: "attitude"
  },
  {
    id: "sun-pointing",
    icon: <Target className="w-4 h-4" />,
    title: "SUN POINTING",
    subtitle: "Solar charge mode",
    category: "attitude"
  },
  {
    id: "establish-link",
    icon: <Radio className="w-4 h-4" />,
    title: "ESTABLISH LINK",
    subtitle: "Ground station",
    category: "comms"
  }
]

export function CommandConsole() {
  const [selectedCommand, setSelectedCommand] = useState("raise-perigee")
  const [executingCommand, setExecutingCommand] = useState(null)
  const [commandStatus, setCommandStatus] = useState(null)
  const [commandHistory, setCommandHistory] = useState([])

  const handleExecuteCommand = (commandId) => {
    if (executingCommand) return
    
    setExecutingCommand(commandId)
    setCommandStatus("queued")

    const command = {
      id: `cmd-${Date.now()}`,
      type: "orbital-maneuver",
      name: commands.find(c => c.id === commandId)?.title || "",
      params: {},
      status: "queued",
      timestamp: Date.now()
    }

    simulateCommandExecution(command, (status, ack) => {
      setCommandStatus(status)
      if (status === "completed" || status === "failed") {
        setCommandHistory(prev => [{
          id: commandId,
          status: status === "completed" ? "completed" : "failed",
          time: new Date().toLocaleTimeString("en-US", { hour12: false })
        }, ...prev.slice(0, 4)])
        setTimeout(() => {
          setExecutingCommand(null)
          setCommandStatus(null)
        }, 1000)
      }
    })
  }

  const orbitalManeuvers = commands.filter(c => c.category === "orbital")
  const attitudeControl = commands.filter(c => c.category === "attitude")
  const communications = commands.filter(c => c.category === "comms")

  return (
    <aside className="w-72 flex-shrink-0 bg-card flex flex-col border-l border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-bold text-foreground">COMMAND CONSOLE</h2>
            <p className="text-xs font-mono text-primary">SAT-01 // READY</p>
          </div>
        </div>
      </div>

      {/* Command execution status */}
      {executingCommand && commandStatus && (
        <div className="p-3 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2 text-sm">
            {commandStatus === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-status-nominal" />
            ) : commandStatus === "failed" ? (
              <AlertCircle className="w-4 h-4 text-status-critical" />
            ) : (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            )}
            <span className="font-mono text-xs text-foreground uppercase">
              {commandStatus.replace("-", " ")}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Orbital Maneuvers */}
        <CommandSection title="Orbital Maneuvers">
          {orbitalManeuvers.map((item) => (
            <CommandButton
              key={item.id}
              item={item}
              selected={selectedCommand === item.id}
              executing={executingCommand === item.id}
              onClick={() => setSelectedCommand(item.id)}
              onExecute={() => handleExecuteCommand(item.id)}
            />
          ))}
        </CommandSection>

        {/* Attitude Control */}
        <CommandSection title="Attitude Control">
          {attitudeControl.map((item) => (
            <CommandButton
              key={item.id}
              item={item}
              selected={selectedCommand === item.id}
              executing={executingCommand === item.id}
              onClick={() => setSelectedCommand(item.id)}
              onExecute={() => handleExecuteCommand(item.id)}
            />
          ))}
        </CommandSection>

        {/* Communications */}
        <CommandSection title="Communications">
          {communications.map((item) => (
            <CommandButton
              key={item.id}
              item={item}
              selected={selectedCommand === item.id}
              executing={executingCommand === item.id}
              onClick={() => setSelectedCommand(item.id)}
              onExecute={() => handleExecuteCommand(item.id)}
            />
          ))}
        </CommandSection>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="p-4 pt-2">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Recent Commands
            </h3>
            <div className="space-y-1">
              {commandHistory.map((cmd, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    {cmd.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-status-nominal" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-status-critical" />
                    )}
                    <span className="text-muted-foreground font-mono">
                      {commands.find(c => c.id === cmd.id)?.title}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">{cmd.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            System Status
          </span>
          <span className="text-xs font-bold text-status-nominal flex items-center gap-1">
            <Zap className="w-3 h-3" />
            NOMINAL
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Next Contact:</span>
          </div>
          <span className="font-mono font-medium text-foreground">08:22</span>
        </div>
      </div>
    </aside>
  )
}

function CommandSection({ title, children }) {
  return (
    <div className="p-4 pb-2">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center font-medium">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function CommandButton({ 
  item, 
  selected,
  executing,
  onClick,
  onExecute
}) {
  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-transparent hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-primary">{item.icon}</div>
        <div className="text-left">
          <div className="text-xs font-semibold text-foreground">{item.title}</div>
          <div className="text-[10px] text-muted-foreground">{item.subtitle}</div>
        </div>
      </div>
      {selected ? (
        <Button 
          size="sm" 
          className="text-xs h-7 px-2"
          onClick={(e) => {
            e.stopPropagation()
            onExecute()
          }}
          disabled={executing}
        >
          {executing ? "..." : "Execute"}
        </Button>
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  )
}
