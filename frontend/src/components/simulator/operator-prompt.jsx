/**
 * Operator Prompt Component
 * 
 * Mission Control Enhancement - Phase 6
 * 
 * Displays time acceleration prompts from backend:
 * - Modal dialog when backend suggests time scale change
 * - Accept/Decline buttons
 * - Shows suggested time scale and reason
 * - Custom time scale option
 */

import { useState, useEffect } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function OperatorPrompt({ sessionId }) {
  const { telemetrySocket } = useWebSocket();
  const [prompt, setPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Listen for time prompts from backend
  useEffect(() => {
    if (!telemetrySocket) return;
    
    const handleTimePrompt = (promptData) => {
      console.log('⏱️ Time prompt received:', promptData);
      setPrompt(promptData);
      setIsOpen(true);
    };
    
    telemetrySocket.on('time:prompt', handleTimePrompt);
    
    return () => {
      telemetrySocket.off('time:prompt', handleTimePrompt);
    };
  }, [telemetrySocket]);
  
  // Handle accept - apply suggested time scale
  const handleAccept = () => {
    if (telemetrySocket && sessionId && prompt) {
      telemetrySocket.emit('time:prompt_response', {
        sessionId,
        promptId: prompt.id,
        accepted: true,
        scale: prompt.suggestedScale
      });
    }
    setIsOpen(false);
    setPrompt(null);
  };
  
  // Handle decline - keep current time scale
  const handleDecline = () => {
    if (telemetrySocket && sessionId && prompt) {
      telemetrySocket.emit('time:prompt_response', {
        sessionId,
        promptId: prompt.id,
        accepted: false
      });
    }
    setIsOpen(false);
    setPrompt(null);
  };
  
  if (!prompt) return null;
  
  // Get time scale label
  const getScaleLabel = (scale) => {
    if (scale === 1) return 'Real Time (1x)';
    if (scale === 60) return '1 minute per second (60x)';
    if (scale === 1000) return 'Maximum Speed (1000x)';
    return `${scale}x Speed`;
  };
  
  // Get icon based on reason
  const getIcon = () => {
    if (prompt.reason === 'critical_operation') {
      return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    }
    return <Clock className="w-8 h-8 text-primary" />;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle>Time Acceleration Recommendation</DialogTitle>
          </div>
          <DialogDescription>
            {prompt.message || 'The system recommends adjusting simulation speed.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current vs Suggested */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Current Speed</p>
              <p className="font-mono font-semibold">
                {getScaleLabel(prompt.currentScale || 1)}
              </p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div>
              <p className="text-xs text-muted-foreground">Suggested Speed</p>
              <p className="font-mono font-semibold text-primary">
                {getScaleLabel(prompt.suggestedScale)}
              </p>
            </div>
          </div>
          
          {/* Reason */}
          {prompt.reason && (
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Reason: </span>
              {prompt.reason === 'critical_operation' && 'Critical operation in progress'}
              {prompt.reason === 'long_wait' && 'Long wait period ahead'}
              {prompt.reason === 'ground_station_pass' && 'Ground station pass coming up'}
              {prompt.reason === 'user_requested' && 'System recommendation'}
            </div>
          )}
          
          {/* Estimated wait time if provided */}
          {prompt.estimatedWaitTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>
                Estimated time: {Math.ceil(prompt.estimatedWaitTime / 60000)} minutes at current speed
              </span>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
          >
            Keep Current
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1"
          >
            Accept {getScaleLabel(prompt.suggestedScale)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
