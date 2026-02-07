/**
 * CommandToggle Component
 * For binary enable/disable commands (e.g., battery charging, autonomous mode)
 */

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Loader2 } from 'lucide-react';

export function CommandToggle({ 
  name, 
  label,
  enabled = true,
  currentState = false,
  disabledReason,
  onToggle 
}) {
  const [toggling, setToggling] = useState(false);
  const [state, setState] = useState(currentState);

  const handleToggle = async (checked) => {
    setToggling(true);
    setState(checked);
    await onToggle(name, checked);
    setTimeout(() => setToggling(false), 500);
  };

  return (
    <div className={`command-toggle border rounded-lg p-4 ${
      !enabled ? 'bg-gray-50 opacity-60' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">
            {label || name.replace(/_/g, ' ')}
          </span>
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
          {toggling && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${
            state ? 'text-green-600' : 'text-gray-400'
          }`}>
            {state ? 'ON' : 'OFF'}
          </span>
          <Switch
            checked={state}
            onCheckedChange={handleToggle}
            disabled={!enabled || toggling}
            className={state ? 'bg-green-600' : ''}
          />
        </div>
      </div>
    </div>
  );
}
