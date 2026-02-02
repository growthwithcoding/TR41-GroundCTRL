/**
 * Time Control Display Component
 * 
 * Mission Control Enhancement - Phase 6
 * 
 * Displays and controls time acceleration:
 * - Current time scale (1x, 10x, 60x, 1000x)
 * - Time scale selector buttons
 * - Pause/resume functionality
 * - Auto-slowdown indicator
 */

import { useState } from 'react';
import { Clock, Pause, Play, FastForward, Zap } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TIME_SCALES = [
  { value: 1, label: '1x', icon: <Clock className="w-3 h-3" />, description: 'Real Time' },
  { value: 2, label: '2x', icon: <FastForward className="w-3 h-3" />, description: 'Fast' },
  { value: 5, label: '5x', icon: <FastForward className="w-3 h-3" />, description: 'Fast' },
  { value: 10, label: '10x', icon: <FastForward className="w-3 h-3" />, description: 'Very Fast' },
  { value: 60, label: '60x', icon: <Zap className="w-3 h-3" />, description: '1 min/sec' },
  { value: 1000, label: '1000x', icon: <Zap className="w-3 h-3" />, description: 'Maximum' }
];

export function TimeControlDisplay({ className = '', sessionId }) {
  const { timeScale, telemetrySocket } = useWebSocket();
  const [isPaused, setIsPaused] = useState(false);
  
  // Send time scale change to backend
  const handleTimeScaleChange = (newScale) => {
    if (telemetrySocket && sessionId) {
      telemetrySocket.emit('time:set_scale', {
        sessionId,
        scale: newScale
      });
    }
  };
  
  // Toggle pause/resume
  const handlePauseToggle = () => {
    if (telemetrySocket && sessionId) {
      const newPausedState = !isPaused;
      setIsPaused(newPausedState);
      
      telemetrySocket.emit('time:set_scale', {
        sessionId,
        scale: newPausedState ? 0 : timeScale || 1
      });
    }
  };
  
  // Get current time scale info
  const currentScale = TIME_SCALES.find(s => s.value === timeScale) || TIME_SCALES[0];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Time scale indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50">
        {currentScale.icon}
        <span className="text-xs font-mono font-semibold text-foreground">
          {isPaused ? 'PAUSED' : currentScale.label}
        </span>
      </div>
      
      {/* Pause/Resume button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handlePauseToggle}
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? (
          <Play className="w-3.5 h-3.5" />
        ) : (
          <Pause className="w-3.5 h-3.5" />
        )}
      </Button>
      
      {/* Time scale dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
          >
            <FastForward className="w-3 h-3 mr-1" />
            Change Speed
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {TIME_SCALES.map((scale) => (
            <DropdownMenuItem
              key={scale.value}
              onClick={() => handleTimeScaleChange(scale.value)}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                {scale.icon}
                <span className="font-mono font-semibold">{scale.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {scale.description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Simulation time display */}
      <div className="text-xs text-muted-foreground font-mono">
        Sim Time
      </div>
    </div>
  );
}
