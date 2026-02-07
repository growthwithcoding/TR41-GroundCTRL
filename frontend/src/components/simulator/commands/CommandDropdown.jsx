/**
 * CommandDropdown Component
 * For commands with enum parameter options (e.g., attitude mode, power mode)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Lock } from 'lucide-react';

const MODE_ICONS = {
  // Attitude modes
  NADIR: '🌍',
  SUN: '☀️',
  INERTIAL_EAST: '⭐',
  TARGET: '🎯',
  
  // Power modes
  nominal: '⚡',
  'low-power': '🔋',
  emergency: '🚨',
  
  // Antenna modes
  'low-gain': '📡',
  'high-gain': '📶',
  omni: '🔘',
  
  // Telemetry packet types
  health: '❤️',
  orbit: '🛰️',
  attitude: '🧭',
  power: '🔋',
  thermal: '🌡️',
  all: '📊'
};

export function CommandDropdown({ 
  name, 
  parameter, 
  options = [], 
  defaultValue,
  enabled = true,
  disabledReason,
  onExecute 
}) {
  const [value, setValue] = useState(defaultValue || options[0]);
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    await onExecute(name, { [parameter]: value });
    setTimeout(() => setExecuting(false), 1000);
  };

  return (
    <div className={`command-dropdown border rounded-lg p-4 ${
      !enabled ? 'bg-gray-50 opacity-60' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm text-foreground">
            {name.replace(/_/g, ' ')}
          </h4>
          {!enabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{disabledReason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Dropdown Select */}
      <div className="mb-3">
        <Select value={value} onValueChange={setValue} disabled={!enabled}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <span className="flex items-center gap-2">
                {MODE_ICONS[value] && <span>{MODE_ICONS[value]}</span>}
                {value.replace(/-/g, ' ').toUpperCase()}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                <span className="flex items-center gap-2">
                  {MODE_ICONS[option] && <span>{MODE_ICONS[option]}</span>}
                  {option.replace(/-/g, ' ').toUpperCase()}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={!enabled || executing}
        className="w-full"
        size="sm"
      >
        {executing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          'Execute'
        )}
      </Button>
    </div>
  );
}
