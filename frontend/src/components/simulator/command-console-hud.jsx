/**
 * Command Console HUD - Compact Mission Control Style
 * Dense, no-scroll layout with all commands always visible
 * Inspired by ISS, Orion, Dragon control panels
 */

import React from 'react';
import { useSimulatorState } from '@/contexts/SimulatorStateContext';
import { Badge } from '@/components/ui/badge';
import {
  CommandButton,
  CommandSlider,
  CommandDropdown,
  CommandToggle,
  CommandCombo
} from './commands';
import { COMMAND_GROUPS } from '@/config/commandConfig';
import {
  Radio,
  Satellite,
  Target
} from 'lucide-react';

export function CommandConsoleHUD() {
  const { 
    executeCommand, 
    missionStarted, 
    satellite,
    steps,
    currentStepIndex
  } = useSimulatorState();

  const currentStep = steps?.[currentStepIndex];
  const requiredCommands = currentStep?.requiredCommands || [];

  const handleCommandExecute = (commandName, parameters = {}) => {
    executeCommand({
      name: commandName,
      type: commandName,
      parameters
    });
  };

  const isCommandEnabled = (command) => {
    if (!missionStarted) return false;
    if (command.resourceCheck) {
      const check = command.resourceCheck(satellite);
      if (!check.enabled) return false;
    }
    return true;
  };

  const getCommandComponent = (command) => {
    const enabled = isCommandEnabled(command);
    const isRequired = requiredCommands.includes(command.name);
    
    const commonProps = {
      command,
      enabled,
      isRequired,
      onExecute: handleCommandExecute
    };

    switch (command.componentType) {
      case 'button':
        return <CommandButton key={command.name} {...commonProps} />;
      case 'slider':
        return <CommandSlider key={command.name} {...commonProps} />;
      case 'dropdown':
        return <CommandDropdown key={command.name} {...commonProps} />;
      case 'toggle':
        return <CommandToggle key={command.name} {...commonProps} />;
      case 'combo':
        return <CommandCombo key={command.name} {...commonProps} />;
      default:
        return null;
    }
  };

  if (!missionStarted) {
    return (
      <div className="w-105 bg-card border-l border-border flex items-center justify-center p-6">
        <div className="text-center">
          <Satellite className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Awaiting Mission Start</p>
        </div>
      </div>
    );
  }

  // Get all command groups
  const allGroups = Object.entries(COMMAND_GROUPS);

  return (
    <div className="w-120 bg-card border-l border-border flex flex-col h-full overflow-hidden">
      {/* Compact Header */}
      <div className="p-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground">CMD INTERFACE</span>
          </div>
          <Badge variant="default" className="text-xs h-5">LIVE</Badge>
        </div>

        {/* Current Objective - Compact */}
        {currentStep && (
          <div className="mt-2 p-1.5 bg-blue-950/20 border border-blue-500/30 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-semibold text-blue-400 uppercase">OBJECTIVE</span>
            </div>
            <p className="text-xs text-foreground leading-tight">{currentStep.text}</p>
          </div>
        )}

        {/* Compact Resource Bar */}
        <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
          <div className="text-center py-0.5 rounded bg-background/50 border border-border/50">
            <div className="text-muted-foreground uppercase">Fuel</div>
            <div className="font-bold text-orange-500">{satellite?.propellantMass_kg?.toFixed(1) || '0'}</div>
          </div>
          <div className="text-center py-0.5 rounded bg-background/50 border border-border/50">
            <div className="text-muted-foreground uppercase">Δv</div>
            <div className="font-bold text-purple-500">{satellite?.deltaVRemaining_ms?.toFixed(0) || '0'}</div>
          </div>
          <div className="text-center py-0.5 rounded bg-background/50 border border-border/50">
            <div className="text-muted-foreground uppercase">Pwr</div>
            <div className="font-bold text-yellow-500">{satellite?.power_percent?.toFixed(0) || '0'}%</div>
          </div>
        </div>
      </div>

      {/* Dense Command Grid - No Scroll */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {allGroups.map(([groupKey, group]) => {
          const availableCommands = group.commands.filter(cmd => isCommandEnabled(cmd));
          if (availableCommands.length === 0) return null;

          return (
            <div key={groupKey} className="border rounded bg-muted/10 overflow-hidden">
              {/* Compact Group Header */}
              <div className="px-2 py-1 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                  {group.label}
                </span>
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {availableCommands.length}
                </Badge>
              </div>

              {/* Ultra-Compact Command Grid */}
              <div className="p-1 grid grid-cols-2 gap-1">
                {group.commands.map((command) => (
                  <div key={command.name} className="min-h-8">
                    {getCommandComponent(command)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Footer */}
      <div className="p-1.5 border-t border-border bg-muted/30 shrink-0">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-muted-foreground">NOMINAL</span>
          </div>
          <span className="text-muted-foreground font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
