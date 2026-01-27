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
import { useSimulatorState } from "@/contexts/SimulatorStateContext"

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
  
  // Use simulator state for command execution
  const { 
    executeCommand, 
    commands: commandHistory, 
    commandsInProgress 
  } = useSimulatorState()

  const handleExecuteCommand = (commandId) => {
    const command = commands.find(c => c.id === commandId)
    
    // Determine command type and parameters based on command ID
    let commandType = "orbital-maneuver"
    let parameters = {}
    
    if (commandId.includes("orient") || commandId.includes("sun-pointing")) {
      commandType = "attitude-control"
    } else if (commandId.includes("link")) {
      commandType = "communication"
    }
    
    if (commandId === "raise-perigee") {
      parameters = { targetAltitude: 400 }
    }
    
    executeCommand({
      type: commandType,
      name: command?.title || "",
      parameters
    })
  }

  const orbitalManeuvers = commands.filter(c => c.category === "orbital")
  const attitudeControl = commands.filter(c => c.category === "attitude")
  const communications = commands.filter(c => c.category === "comms")

  return (
    <aside className="w-72 shrink-0 bg-card flex flex-col border-l border-border overflow-hidden">
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
      {commandsInProgress.size > 0 && (
        <div className="p-3 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="font-mono text-xs text-foreground uppercase">
              Executing {commandsInProgress.size} command{commandsInProgress.size > 1 ? 's' : ''}
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
              executing={commandsInProgress.size > 0}
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
              executing={commandsInProgress.size > 0}
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
              executing={commandsInProgress.size > 0}
              onClick={() => setSelectedCommand(item.id)}
              onExecute={() => handleExecuteCommand(item.id)}
            />
          ))}
        </CommandSection>

        {/* Command History - from context */}
        {commandHistory.length > 0 && (
          <div className="p-4 pt-2">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Recent Commands
            </h3>
            <div className="space-y-1">
              {commandHistory.slice(-5).reverse().map((cmd) => (
                <div key={cmd.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    {cmd.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-status-nominal" />
                    ) : cmd.status === "failed" ? (
                      <AlertCircle className="w-3 h-3 text-status-critical" />
                    ) : (
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    )}
                    <span className="text-muted-foreground font-mono">
                      {cmd.name}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {new Date(cmd.timestamp).toLocaleTimeString()}
                  </span>
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
