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

// Mission Control Enhancement - Real backend commands from commandSchemas.js
const commands = [
  // Commissioning commands (Mission Control Phase 1)
  {
    id: "PING",
    icon: <Radio className="w-4 h-4" />,
    title: "PING",
    subtitle: "Test connection",
    category: "commissioning",
    description: "Verify satellite is responsive"
  },
  {
    id: "UPDATETIME",
    icon: <Clock className="w-4 h-4" />,
    title: "UPDATE TIME",
    subtitle: "Sync clock",
    category: "commissioning",
    description: "Update satellite onboard time"
  },
  {
    id: "DEPLOY_ANTENNA",
    icon: <Radio className="w-4 h-4" />,
    title: "DEPLOY ANTENNA",
    subtitle: "Communications",
    category: "commissioning",
    description: "Deploy communications antenna"
  },
  {
    id: "WAIT_FOR_BEACON",
    icon: <Radio className="w-4 h-4" />,
    title: "WAIT FOR BEACON",
    subtitle: "Listen mode",
    category: "commissioning",
    description: "Wait for satellite beacon transmission"
  },
  
  // Data management commands
  {
    id: "REQUEST_TELEMETRY",
    icon: <Terminal className="w-4 h-4" />,
    title: "REQUEST TELEMETRY",
    subtitle: "Get status",
    category: "data",
    description: "Request current satellite telemetry"
  },
  {
    id: "SCHEDULE_DOWNLINK",
    icon: <ChevronRight className="w-4 h-4" />,
    title: "SCHEDULE DOWNLINK",
    subtitle: "Data transfer",
    category: "data",
    description: "Schedule data downlink pass"
  },
  
  // Advanced operations
  {
    id: "CALIBRATE_SENSORS",
    icon: <Target className="w-4 h-4" />,
    title: "CALIBRATE SENSORS",
    subtitle: "Fine-tune",
    category: "operations",
    description: "Calibrate onboard sensors"
  },
  {
    id: "ENABLE_AUTONOMOUS",
    icon: <Zap className="w-4 h-4" />,
    title: "ENABLE AUTONOMOUS",
    subtitle: "Auto mode",
    category: "operations",
    description: "Enable autonomous operations"
  },
  {
    id: "DISABLE_AUTONOMOUS",
    icon: <AlertCircle className="w-4 h-4" />,
    title: "DISABLE AUTONOMOUS",
    subtitle: "Manual mode",
    category: "operations",
    description: "Disable autonomous operations"
  },
  
  // Orbit commands (existing)
  {
    id: "SET_ORBIT_ALTITUDE",
    icon: <Rocket className="w-4 h-4" />,
    title: "SET ORBIT ALTITUDE",
    subtitle: "Adjust altitude",
    category: "orbital",
    description: "Change orbital altitude"
  },
  {
    id: "STATION_KEEPING",
    icon: <RotateCcw className="w-4 h-4" />,
    title: "STATION KEEPING",
    subtitle: "Maintain position",
    category: "orbital",
    description: "Maintain current orbital position"
  },
  
  // Attitude commands (existing)
  {
    id: "SET_ATTITUDE_MODE",
    icon: <Navigation className="w-4 h-4" />,
    title: "SET ATTITUDE MODE",
    subtitle: "Point satellite",
    category: "attitude",
    description: "Set satellite pointing mode"
  },
  {
    id: "SET_POINTING_TARGET",
    icon: <Target className="w-4 h-4" />,
    title: "SET POINTING TARGET",
    subtitle: "Target lock",
    category: "attitude",
    description: "Set pointing target"
  },
  
  // Power commands
  {
    id: "DEPLOY_SOLAR_ARRAYS",
    icon: <Zap className="w-4 h-4" />,
    title: "DEPLOY SOLAR ARRAYS",
    subtitle: "Power up",
    category: "power",
    description: "Deploy solar panels"
  },
  {
    id: "SET_POWER_MODE",
    icon: <Zap className="w-4 h-4" />,
    title: "SET POWER MODE",
    subtitle: "Manage power",
    category: "power",
    description: "Set power management mode"
  },
  
  // Communication commands
  {
    id: "ENABLE_TRANSMITTER",
    icon: <Radio className="w-4 h-4" />,
    title: "ENABLE TRANSMITTER",
    subtitle: "Start TX",
    category: "comms",
    description: "Enable transmitter"
  },
  {
    id: "DISABLE_TRANSMITTER",
    icon: <Radio className="w-4 h-4" />,
    title: "DISABLE TRANSMITTER",
    subtitle: "Stop TX",
    category: "comms",
    description: "Disable transmitter"
  }
]

export function CommandConsole() {
  const [selectedCommand, setSelectedCommand] = useState("PING")
  
  // Use simulator state for command execution
  const { 
    executeCommand, 
    commands: commandHistory, 
    commandsInProgress 
  } = useSimulatorState()

  const handleExecuteCommand = (commandId) => {
    const command = commands.find(c => c.id === commandId)
    
    if (!command) return;
    
    // Build parameters based on command type
    const parameters = {};
    
    // Add specific parameters for certain commands
    if (commandId === 'SET_ORBIT_ALTITUDE') {
      parameters.targetAltitude_km = 420;
    } else if (commandId === 'SET_ATTITUDE_MODE') {
      parameters.mode = 'nadir';
    } else if (commandId === 'SET_POWER_MODE') {
      parameters.mode = 'nominal';
    } else if (commandId === 'UPDATETIME') {
      parameters.timestamp = Date.now();
    }
    
    // Execute command through context (which will emit to backend via WebSocket)
    executeCommand({
      type: command.category,
      name: commandId, // Use the actual command ID from backend
      commandName: commandId, // Backend expects commandName
      parameters
    })
  }

  // Group commands by category
  const commissioningCommands = commands.filter(c => c.category === "commissioning")
  const dataCommands = commands.filter(c => c.category === "data")
  const operationsCommands = commands.filter(c => c.category === "operations")
  const orbitalCommands = commands.filter(c => c.category === "orbital")
  const attitudeCommands = commands.filter(c => c.category === "attitude")
  const powerCommands = commands.filter(c => c.category === "power")
  const commsCommands = commands.filter(c => c.category === "comms")

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
        {/* Commissioning Commands - Mission Control Enhancement */}
        {commissioningCommands.length > 0 && (
          <CommandSection title="Commissioning">
            {commissioningCommands.map((item) => (
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
        )}

        {/* Data Management Commands - Mission Control Enhancement */}
        {dataCommands.length > 0 && (
          <CommandSection title="Data Management">
            {dataCommands.map((item) => (
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
        )}

        {/* Operations Commands - Mission Control Enhancement */}
        {operationsCommands.length > 0 && (
          <CommandSection title="Operations">
            {operationsCommands.map((item) => (
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
        )}

        {/* Orbital Maneuvers */}
        {orbitalCommands.length > 0 && (
          <CommandSection title="Orbital">
            {orbitalCommands.map((item) => (
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
        )}

        {/* Attitude Control */}
        {attitudeCommands.length > 0 && (
          <CommandSection title="Attitude">
            {attitudeCommands.map((item) => (
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
        )}

        {/* Power Management */}
        {powerCommands.length > 0 && (
          <CommandSection title="Power">
            {powerCommands.map((item) => (
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
        )}

        {/* Communications */}
        {commsCommands.length > 0 && (
          <CommandSection title="Communications">
            {commsCommands.map((item) => (
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
        )}

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
