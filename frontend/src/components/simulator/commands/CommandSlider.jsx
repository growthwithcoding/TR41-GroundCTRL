/**
 * CommandSlider Component
 * For commands with numeric range parameters (e.g., altitude, delta-V)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CommandSlider({ 
  name, 
  parameter, 
  min, 
  max, 
  step = 1, 
  defaultValue, 
  unit, 
  enabled = true,
  disabledReason,
  validation,
  onExecute 
}) {
  const [value, setValue] = useState(defaultValue || min);
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    await onExecute(name, { [parameter]: value });
    setTimeout(() => setExecuting(false), 1000);
  };

  const isValid = validation ? validation(value) : true;
  const validationMessage = validation ? validation.getMessage?.(value) : null;

  return (
    <div className={`command-slider border rounded-lg p-4 ${
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
        {!isValid && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{validationMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isValid && value !== defaultValue && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
      </div>

      {/* Value Display */}
      <div className="mb-3 text-center">
        <span className="text-2xl font-bold text-primary">
          {value.toFixed(step >= 1 ? 0 : 1)}
        </span>
        <span className="ml-2 text-sm text-muted-foreground">{unit}</span>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <Slider
          value={[value]}
          onValueChange={([v]) => setValue(v)}
          min={min}
          max={max}
          step={step}
          disabled={!enabled}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">{min} {unit}</span>
          <span className="text-xs text-muted-foreground">{max} {unit}</span>
        </div>
      </div>

      {/* Number Input */}
      <div className="flex gap-2 mb-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={!enabled}
          className="flex-1"
        />
        <span className="flex items-center text-sm text-muted-foreground px-2">
          {unit}
        </span>
      </div>

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={!enabled || !isValid || executing}
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

      {/* Validation Message */}
      {validationMessage && (
        <p className={`text-xs mt-2 ${isValid ? 'text-green-600' : 'text-yellow-600'}`}>
          {validationMessage}
        </p>
      )}
    </div>
  );
}
