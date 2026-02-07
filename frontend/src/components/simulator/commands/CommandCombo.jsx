/**
 * CommandCombo Component
 * For commands with multiple parameters (e.g., burn with duration + thrust, pointing with target + angles)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Lock, Info } from 'lucide-react';

export function CommandCombo({ 
  name, 
  parameters = [], 
  enabled = true,
  disabledReason,
  resourceInfo,
  onExecute 
}) {
  const [values, setValues] = useState(() => {
    const initial = {};
    parameters.forEach(param => {
      initial[param.name] = param.defaultValue || param.min || '';
    });
    return initial;
  });
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    await onExecute(name, values);
    setTimeout(() => setExecuting(false), 1000);
  };

  const updateValue = (paramName, value) => {
    setValues(prev => ({ ...prev, [paramName]: value }));
  };

  const renderParameter = (param) => {
    switch (param.type) {
      case 'slider':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">{param.label || param.name.replace(/_/g, ' ')}</Label>
              <span className="text-sm font-semibold text-primary">
                {values[param.name]} {param.unit}
              </span>
            </div>
            <Slider
              value={[values[param.name]]}
              onValueChange={([v]) => updateValue(param.name, v)}
              min={param.min}
              max={param.max}
              step={param.step || 1}
              disabled={!enabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{param.min} {param.unit}</span>
              <span>{param.max} {param.unit}</span>
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div key={param.name} className="space-y-2">
            <Label className="text-xs">{param.label || param.name.replace(/_/g, ' ')}</Label>
            <Select 
              value={values[param.name]} 
              onValueChange={(v) => updateValue(param.name, v)}
              disabled={!enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options.map(option => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'text':
        return (
          <div key={param.name} className="space-y-2">
            <Label className="text-xs">{param.label || param.name.replace(/_/g, ' ')}</Label>
            <Input
              type="text"
              value={values[param.name]}
              onChange={(e) => updateValue(param.name, e.target.value)}
              placeholder={param.placeholder}
              disabled={!enabled}
            />
          </div>
        );

      case 'number':
        return (
          <div key={param.name} className="space-y-2">
            <Label className="text-xs">{param.label || param.name.replace(/_/g, ' ')}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={values[param.name]}
                onChange={(e) => updateValue(param.name, Number(e.target.value))}
                min={param.min}
                max={param.max}
                step={param.step}
                disabled={!enabled}
                className="flex-1"
              />
              {param.unit && (
                <span className="flex items-center text-sm text-muted-foreground px-2">
                  {param.unit}
                </span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`command-combo border rounded-lg p-4 ${
      !enabled ? 'bg-gray-50 opacity-60' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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
        {resourceInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs space-y-1">
                  {resourceInfo.fuelRequired && (
                    <p>Fuel Required: {resourceInfo.fuelRequired.toFixed(2)} kg</p>
                  )}
                  {resourceInfo.fuelAvailable && (
                    <p>Available: {resourceInfo.fuelAvailable.toFixed(2)} kg</p>
                  )}
                  {resourceInfo.duration && (
                    <p>Duration: {resourceInfo.duration.toFixed(1)} s</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Parameters */}
      <div className="space-y-4 mb-4">
        {parameters.map(param => renderParameter(param))}
      </div>

      {/* Resource Info Display */}
      {resourceInfo && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-xs space-y-1">
          {resourceInfo.fuelRequired && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Required:</span>
              <span className="font-semibold">{resourceInfo.fuelRequired.toFixed(2)} kg</span>
            </div>
          )}
          {resourceInfo.fuelAvailable !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available:</span>
              <span className={`font-semibold ${
                resourceInfo.fuelAvailable >= resourceInfo.fuelRequired ? 'text-green-600' : 'text-red-600'
              }`}>
                {resourceInfo.fuelAvailable.toFixed(2)} kg
              </span>
            </div>
          )}
        </div>
      )}

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
          'Execute Command'
        )}
      </Button>
    </div>
  );
}
