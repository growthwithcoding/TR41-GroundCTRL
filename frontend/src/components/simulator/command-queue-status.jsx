/**
 * Command Queue Status Component
 * 
 * Mission Control Enhancement - Phase 6
 * 
 * Displays real-time command queue status with:
 * - Commands in transit (uplink_in_progress → executing → completed)
 * - Latency progress bars
 * - ETA countdown timers
 * - Status indicators
 */

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Radio,
  Rocket
} from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function CommandQueueStatus({ className = '' }) {
  const { commandQueueStatus } = useWebSocket();
  const [activeCommands, setActiveCommands] = useState([]);
  
  // Update active commands list when queue status changes
  useEffect(() => {
    // Filter to only show in-progress commands
    const active = Array.from(commandQueueStatus.values())
      .filter(cmd => 
        cmd.status === 'uplink_in_progress' || 
        cmd.status === 'executing'
      )
      .sort((a, b) => a.queuedAt - b.queuedAt); // Oldest first
    
    setActiveCommands(active);
  }, [commandQueueStatus]);
  
  // Don't render if no active commands
  if (activeCommands.length === 0) {
    return null;
  }
  
  return (
    <Card className={`p-3 bg-card/95 backdrop-blur border-border ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-primary animate-pulse" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Command Queue
        </h3>
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          {activeCommands.length} active
        </span>
      </div>
      
      <div className="space-y-2">
        {activeCommands.map((cmd) => (
          <CommandQueueItem key={cmd.commandId} command={cmd} />
        ))}
      </div>
    </Card>
  );
}

function CommandQueueItem({ command }) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  useEffect(() => {
    // Calculate progress and time remaining
    const updateProgress = () => {
      const now = Date.now();
      const queuedAt = command.queuedAt || now;
      const expectedCompletionTime = command.expectedCompletionTime || now + 90000;
      
      const totalDuration = expectedCompletionTime - queuedAt;
      const elapsed = now - queuedAt;
      const remaining = Math.max(0, expectedCompletionTime - now);
      
      const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);
      
      setProgress(progressPercent);
      setTimeRemaining(Math.ceil(remaining / 1000)); // seconds
    };
    
    // Update immediately
    updateProgress();
    
    // Update every second
    const interval = setInterval(updateProgress, 1000);
    
    return () => clearInterval(interval);
  }, [command]);
  
  // Get status icon and color
  const getStatusInfo = () => {
    switch (command.status) {
      case 'uplink_in_progress':
        return {
          icon: <Radio className="w-3.5 h-3.5 animate-pulse" />,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          label: 'UPLINK'
        };
      case 'executing':
        return {
          icon: <Rocket className="w-3.5 h-3.5" />,
          color: 'text-primary',
          bg: 'bg-primary/10',
          label: 'EXEC'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          color: 'text-status-nominal',
          bg: 'bg-status-nominal/10',
          label: 'DONE'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          color: 'text-status-critical',
          bg: 'bg-status-critical/10',
          label: 'FAIL'
        };
      default:
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          label: 'QUEUE'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`${statusInfo.color} ${statusInfo.bg} p-1 rounded`}>
            {statusInfo.icon}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground font-mono">
              {command.commandName || command.name || 'UNKNOWN'}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {statusInfo.label}
            </div>
          </div>
        </div>
        
        {timeRemaining > 0 && (
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeRemaining}s</span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <Progress 
        value={progress} 
        className="h-1.5"
      />
      
      {/* Message if any */}
      {command.message && (
        <p className="text-[10px] text-muted-foreground italic">
          {command.message}
        </p>
      )}
    </div>
  );
}
