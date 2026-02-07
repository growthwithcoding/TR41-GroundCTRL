/**
 * Burn Planner Tool
 * Visual trajectory prediction and optimal burn timing calculator
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Target,
  Clock,
  Fuel,
  TrendingUp,
  RotateCw,
  Info,
  Play
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EARTH_RADIUS = 6371; // km
const MU_EARTH = 398600.4418; // km³/s²

export function BurnPlanner({ currentOrbit, satellite, onExecuteBurn }) {
  const [deltaV, setDeltaV] = useState(150);
  const [direction, setDirection] = useState('prograde');
  const [burnTime, setBurnTime] = useState('now');
  const [targetAnomaly, setTargetAnomaly] = useState(0);
  
  // Calculate burn results
  const calculateBurnResult = () => {
    if (!currentOrbit) {
      return null;
    }

    const { a, e, trueAnomaly } = currentOrbit;
    
    // Current orbital parameters
    const currentPeriapsis = a * (1 - e) - EARTH_RADIUS;
    const currentApoapsis = a * (1 + e) - EARTH_RADIUS;
    const currentPeriod = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / MU_EARTH) / 60; // minutes
    
    // Calculate propellant required
    const Isp = satellite?.thruster?.Isp_sec || 220;
    const G0 = 9.80665;
    const m0 = (satellite?.dryMass_kg || 100) + (satellite?.propellantMass_kg || 10);
    const m1 = m0 * Math.exp(-deltaV / (Isp * G0 / 1000));
    const propellantUsed = m0 - m1;
    
    // Calculate burn duration
    const thrust = satellite?.thruster?.thrust_N || 50;
    const burnDuration = propellantUsed / (thrust / (Isp * G0));
    
    // Estimate new orbit (simplified)
    let newPeriapsis = currentPeriapsis;
    let newApoapsis = currentApoapsis;
    
    const atPeriapsis = Math.abs(trueAnomaly) < 10;
    const atApoapsis = Math.abs(trueAnomaly - 180) < 10;
    
    if (direction === 'prograde') {
      if (atPeriapsis) {
        // Raise apoapsis
        newApoapsis = currentApoapsis + (deltaV * 2);
      } else if (atApoapsis) {
        // Raise periapsis
        newPeriapsis = currentPeriapsis + (deltaV * 2);
      } else {
        // General case
        newApoapsis = currentApoapsis + deltaV;
        newPeriapsis = currentPeriapsis + (deltaV * 0.5);
      }
    } else if (direction === 'retrograde') {
      if (atPeriapsis) {
        // Lower apoapsis
        newApoapsis = Math.max(currentPeriapsis, currentApoapsis - (deltaV * 2));
      } else if (atApoapsis) {
        // Lower periapsis
        newPeriapsis = Math.max(160, currentPeriapsis - (deltaV * 2));
      }
    }
    
    const newA = (newPeriapsis + newApoapsis) / 2 + EARTH_RADIUS;
    const newE = (newApoapsis - newPeriapsis) / (newApoapsis + newPeriapsis + 2 * EARTH_RADIUS);
    const newPeriod = 2 * Math.PI * Math.sqrt(Math.pow(newA, 3) / MU_EARTH) / 60;
    
    return {
      currentOrbit: {
        periapsis: currentPeriapsis,
        apoapsis: currentApoapsis,
        period: currentPeriod
      },
      newOrbit: {
        periapsis: newPeriapsis,
        apoapsis: newApoapsis,
        period: newPeriod,
        eccentricity: newE
      },
      burn: {
        deltaV,
        propellantUsed,
        burnDuration,
        direction
      }
    };
  };

  const result = calculateBurnResult();

  // Calculate time to optimal burn point
  const calculateTimeToOptimal = () => {
    if (!currentOrbit) return null;
    
    const { trueAnomaly, a } = currentOrbit;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / MU_EARTH);
    
    let optimalAnomaly = direction === 'prograde' ? 0 : 180;
    if (burnTime === 'apoapsis') optimalAnomaly = 180;
    if (burnTime === 'periapsis') optimalAnomaly = 0;
    
    let angleToOptimal = (optimalAnomaly - trueAnomaly + 360) % 360;
    if (angleToOptimal > 180) angleToOptimal -= 360;
    
    const timeToOptimal = (angleToOptimal / 360) * period;
    
    return {
      time: Math.abs(timeToOptimal),
      angle: angleToOptimal,
      optimalAnomaly
    };
  };

  const timing = calculateTimeToOptimal();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExecute = () => {
    if (onExecuteBurn && result) {
      onExecuteBurn({
        name: 'EXECUTE_ORBITAL_MANEUVER',
        parameters: {
          delta_v_ms: deltaV,
          burn_direction: direction
        }
      });
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Burn Planner</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Advanced
        </Badge>
      </div>

      {/* Current Orbit Info */}
      {result && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="text-xs font-semibold text-foreground mb-2">Current Orbit</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Periapsis:</span>
              <p className="font-semibold">{result.currentOrbit.periapsis.toFixed(0)} km</p>
            </div>
            <div>
              <span className="text-muted-foreground">Apoapsis:</span>
              <p className="font-semibold">{result.currentOrbit.apoapsis.toFixed(0)} km</p>
            </div>
            <div>
              <span className="text-muted-foreground">Period:</span>
              <p className="font-semibold">{result.currentOrbit.period.toFixed(1)} min</p>
            </div>
          </div>
        </div>
      )}

      {/* Burn Parameters */}
      <div className="space-y-4 mb-4">
        {/* Delta-V Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-xs">Delta-V</Label>
            <span className="text-sm font-bold text-primary">{deltaV} m/s</span>
          </div>
          <Slider
            value={[deltaV]}
            onValueChange={([v]) => setDeltaV(v)}
            min={0}
            max={500}
            step={1}
            className="w-full"
          />
        </div>

        {/* Direction Select */}
        <div>
          <Label className="text-xs mb-2 block">Direction</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prograde">🚀 Prograde (speed up)</SelectItem>
              <SelectItem value="retrograde">⬅️ Retrograde (slow down)</SelectItem>
              <SelectItem value="normal">⬆️ Normal (change inclination)</SelectItem>
              <SelectItem value="anti-normal">⬇️ Anti-normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Burn Timing */}
        <div>
          <Label className="text-xs mb-2 block">Burn Timing</Label>
          <Select value={burnTime} onValueChange={setBurnTime}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Execute Now</SelectItem>
              <SelectItem value="periapsis">At Periapsis</SelectItem>
              <SelectItem value="apoapsis">At Apoapsis</SelectItem>
              <SelectItem value="custom">Custom Position</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Predicted Results */}
      {result && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Predicted Orbit
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">New Periapsis:</span>
              <p className="font-semibold text-foreground">
                {result.newOrbit.periapsis.toFixed(0)} km
                <span className={`ml-1 text-xs ${
                  result.newOrbit.periapsis > result.currentOrbit.periapsis
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  ({result.newOrbit.periapsis > result.currentOrbit.periapsis ? '+' : ''}
                  {(result.newOrbit.periapsis - result.currentOrbit.periapsis).toFixed(0)})
                </span>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">New Apoapsis:</span>
              <p className="font-semibold text-foreground">
                {result.newOrbit.apoapsis.toFixed(0)} km
                <span className={`ml-1 text-xs ${
                  result.newOrbit.apoapsis > result.currentOrbit.apoapsis
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  ({result.newOrbit.apoapsis > result.currentOrbit.apoapsis ? '+' : ''}
                  {(result.newOrbit.apoapsis - result.currentOrbit.apoapsis).toFixed(0)})
                </span>
              </p>
            </div>
          </div>

          {/* Burn Info */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-blue-200 dark:border-blue-800">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Fuel className="w-3 h-3 text-orange-500 mb-1" />
                    <p className="font-semibold">{result.burn.propellantUsed.toFixed(2)} kg</p>
                    <p className="text-muted-foreground">Fuel Cost</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Propellant required for this burn</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Clock className="w-3 h-3 text-blue-500 mb-1" />
                    <p className="font-semibold">{result.burn.burnDuration.toFixed(1)} s</p>
                    <p className="text-muted-foreground">Duration</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Burn execution time</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <TrendingUp className="w-3 h-3 text-green-500 mb-1" />
                    <p className="font-semibold">{result.newOrbit.eccentricity.toFixed(4)}</p>
                    <p className="text-muted-foreground">Eccentricity</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New orbital eccentricity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Timing Info */}
      {timing && burnTime !== 'now' && (
        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-foreground">
              Time to optimal: <span className="font-bold">{formatTime(timing.time)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleExecute}
          disabled={!result || (satellite?.propellantMass_kg || 0) < (result?.burn.propellantUsed || 0)}
          className="flex-1"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Burn
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setDeltaV(150);
            setDirection('prograde');
            setBurnTime('now');
          }}
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Warning if insufficient fuel */}
      {result && (satellite?.propellantMass_kg || 0) < result.burn.propellantUsed && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <Info className="w-4 h-4" />
            <span>Insufficient fuel for this burn</span>
          </div>
        </div>
      )}
    </Card>
  );
}
