/**
 * Enhanced Command Console
 * Implements the full game mechanics command UI specification
 * Uses specialized components for different parameter types
 */

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Zap, Clock, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSimulatorState } from '@/contexts/SimulatorStateContext';
import {
  CommandButton,
  CommandSlider,
  CommandDropdown,
  CommandToggle,
  CommandCombo
} from './commands';
import { COMMAND_GROUPS, getCommandConfig } from '@/config/commandConfig';

export function CommandConsoleEnhanced() {
  const { executeCommand, commandsInProgress, satellite, sessionState } = useSimulatorState();
  const [openGroups, setOpenGroups] = useState(['commissioning']); // Start with commissioning open

  // Toggle group open/closed
  const toggleGroup = (groupName) => {
    setOpenGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  // Check if command is enabled based on step constraints
  const isCommandEnabled = (commandName) => {
    // Get current step constraints
    const currentStep = sessionState?.currentStep;
    
    if (!currentStep) return true;

    // Check if explicitly allowed
    if (currentStep.allowedCommands?.includes(commandName)) {
      return true;
    }

    // Check if explicitly restricted
    if (currentStep.restrictedCommands?.includes(commandName)) {
      return false;
    }

    // Check resource-based constraints
    if (commandName.includes('BURN') || commandName.includes('MANEUVER')) {
      const fuelAvailable = satellite?.propellantMass_kg || 0;
      if (fuelAvailable < 1.0) {
        return false;
      }
    }

    // Default: enabled
    return true;
  };

  // Get disabled reason
  const getDisabledReason = (commandName) => {
    const currentStep = sessionState?.currentStep;
    
    if (currentStep?.restrictedCommands?.includes(commandName)) {
      return `Not allowed in current step: ${currentStep.title}`;
    }

    if (commandName.includes('BURN') || commandName.includes('MANEUVER')) {
      const fuelAvailable = satellite?.propellantMass_kg || 0;
      if (fuelAvailable < 1.0) {
        return `Insufficient fuel: ${fuelAvailable.toFixed(2)} kg`;
      }
    }

    return 'Command requirements not met';
  };

  // Handle command execution
  const handleExecuteCommand = async (commandName, parameters = {}) => {
    console.log('Executing command:', commandName, parameters);
    
    await executeCommand({
      name: commandName,
      commandName: commandName,
      parameters,
      type: getCommandSubsystem(commandName)
    });
  };

  // Handle toggle commands
  const handleToggle = async (commandName, enabled) => {
    await handleExecuteCommand(commandName, { enabled });
  };

  // Render command based on its configuration
  const renderCommand = (commandName) => {
    const config = getCommandConfig(commandName);
    const enabled = isCommandEnabled(commandName);
    const disabledReason = enabled ? null : getDisabledReason(commandName);
    const executing = commandsInProgress.has(commandName);

    const commonProps = {
      name: commandName,
      enabled,
      disabledReason,
      executing
    };

    switch (config.type) {
      case 'button':
        return (
          <CommandButton
            {...commonProps}
            icon={config.icon}
            onExecute={() => handleExecuteCommand(commandName)}
          />
        );

      case 'slider':
        return (
          <CommandSlider
            {...commonProps}
            parameter={config.parameter}
            min={config.min}
            max={config.max}
            step={config.step}
            defaultValue={config.defaultValue}
            unit={config.unit}
            onExecute={handleExecuteCommand}
          />
        );

      case 'dropdown':
        return (
          <CommandDropdown
            {...commonProps}
            parameter={config.parameter}
            options={config.options}
            defaultValue={config.defaultValue}
            onExecute={handleExecuteCommand}
          />
        );

      case 'toggle':
        return (
          <CommandToggle
            {...commonProps}
            label={config.label}
            currentState={false} // TODO: Get from satellite state
            onToggle={handleToggle}
          />
        );

      case 'combo':
        // Calculate resource info for burn commands
        let resourceInfo = null;
        if (commandName === 'EXECUTE_BURN' || commandName === 'EXECUTE_ORBITAL_MANEUVER') {
          resourceInfo = {
            fuelRequired: 2.5, // TODO: Calculate from parameters
            fuelAvailable: satellite?.propellantMass_kg || 0,
            duration: 60 // TODO: Calculate from parameters
          };
        }

        return (
          <CommandCombo
            {...commonProps}
            parameters={config.parameters}
            resourceInfo={resourceInfo}
            onExecute={handleExecuteCommand}
          />
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-96 shrink-0 bg-card flex flex-col border-l border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-bold text-foreground">COMMAND CONSOLE</h2>
            <p className="text-xs font-mono text-primary">
              SAT-01 // {commandsInProgress.size > 0 ? 'EXECUTING' : 'READY'}
            </p>
          </div>
          {sessionState?.currentStep && (
            <Badge variant="outline" className="text-xs">
              Step {sessionState.currentStep.stepOrder}
            </Badge>
          )}
        </div>
      </div>

      {/* Execution Status */}
      {commandsInProgress.size > 0 && (
        <div className="p-3 border-b border-border bg-primary/5 animate-pulse">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary animate-spin" />
            <span className="font-mono text-xs text-foreground uppercase">
              Executing {commandsInProgress.size} command{commandsInProgress.size > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Current Step Info */}
      {sessionState?.currentStep && (
        <div className="p-3 border-b border-border bg-blue-50 dark:bg-blue-950">
          <h3 className="text-xs font-semibold text-foreground mb-1">
            Current Objective
          </h3>
          <p className="text-xs text-muted-foreground">
            {sessionState.currentStep.title}
          </p>
          {sessionState.currentStep.timeLimit && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>Time Limit: {sessionState.currentStep.timeLimit}s</span>
            </div>
          )}
        </div>
      )}

      {/* Commands Scroll Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {Object.entries(COMMAND_GROUPS).map(([groupName, group]) => (
            <Collapsible
              key={groupName}
              open={openGroups.includes(groupName)}
              onOpenChange={() => toggleGroup(groupName)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{group.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.commands.length}
                    </Badge>
                  </div>
                  {openGroups.includes(groupName) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-2">
                {group.commands.map(commandName => (
                  <div key={commandName}>
                    {renderCommand(commandName)}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Resource Status Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Fuel Remaining</span>
            <span className="font-mono font-semibold">
              {satellite?.propellantMass_kg?.toFixed(2) || '0.00'} kg
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Delta-V Budget</span>
            <span className="font-mono font-semibold">
              {satellite?.deltaVRemaining_ms?.toFixed(1) || '0.0'} m/s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Power Level</span>
            <span className={`font-mono font-semibold ${
              (satellite?.power_percent || 0) > 50 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {satellite?.power_percent?.toFixed(0) || '0'}%
            </span>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            System Status
          </span>
          <span className="text-xs font-bold text-status-nominal flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {satellite?.status || 'NOMINAL'}
          </span>
        </div>
      </div>
    </aside>
  );
}

// Helper to get subsystem from command name
function getCommandSubsystem(commandName) {
  for (const [groupName, group] of Object.entries(COMMAND_GROUPS)) {
    if (group.commands.includes(commandName)) {
      return groupName;
    }
  }
  return 'system';
}
