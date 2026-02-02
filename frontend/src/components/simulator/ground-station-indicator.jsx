/**
 * Ground Station Indicator Component
 * 
 * Mission Control Enhancement - Phase 6
 * 
 * Displays satellite-ground station communication status:
 * - "LINK UP" badge when satellite visible
 * - "NO LINK" with next pass countdown
 * - Signal strength meter
 * - Ground station name and elevation
 */

import { useEffect, useState } from 'react';
import { Radio, SignalHigh, SignalLow, SignalZero, Clock } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Badge } from '@/components/ui/badge';

export function GroundStationIndicator({ className = '' }) {
  const { groundStationLink, beaconStatus } = useWebSocket();
  const [nextPassCountdown, setNextPassCountdown] = useState(null);
  
  // Calculate next pass countdown
  useEffect(() => {
    if (!groundStationLink.isVisible && groundStationLink.nextPass) {
      const updateCountdown = () => {
        const now = Date.now();
        const nextPassTime = new Date(groundStationLink.nextPass.startTime).getTime();
        const remaining = nextPassTime - now;
        
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setNextPassCountdown({ minutes, seconds });
        } else {
          setNextPassCountdown(null);
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(interval);
    } else {
      setNextPassCountdown(null);
    }
  }, [groundStationLink]);
  
  // Get signal strength icon
  const getSignalIcon = (strength) => {
    if (strength >= 70) return <SignalHigh className="w-4 h-4" />;
    if (strength >= 40) return <SignalLow className="w-4 h-4" />;
    return <SignalZero className="w-4 h-4" />;
  };
  
  // Link is up
  if (groundStationLink.isVisible && beaconStatus.received) {
    const signalStrength = beaconStatus.signalStrength || groundStationLink.visibility?.signalStrength || 0;
    const elevation = groundStationLink.visibility?.elevation || 0;
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="default" className="bg-status-nominal text-white animate-pulse">
          <Radio className="w-3 h-3 mr-1" />
          LINK UP
        </Badge>
        
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-status-nominal">
            {getSignalIcon(signalStrength)}
            <span className="font-mono">{Math.round(signalStrength)}%</span>
          </div>
          
          <span className="text-muted-foreground">•</span>
          
          <span className="font-mono text-foreground">
            {beaconStatus.groundStation?.name || groundStationLink.station?.name || 'Ground Station'}
          </span>
          
          <span className="text-muted-foreground">•</span>
          
          <span className="font-mono text-muted-foreground">
            {Math.round(elevation)}° elev
          </span>
        </div>
      </div>
    );
  }
  
  // No link - show next pass
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
        <Radio className="w-3 h-3 mr-1 opacity-50" />
        NO LINK
      </Badge>
      
      {nextPassCountdown && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">
            Next pass: {nextPassCountdown.minutes}m {nextPassCountdown.seconds}s
          </span>
        </div>
      )}
      
      {groundStationLink.nextPass && (
        <span className="text-xs font-mono text-muted-foreground">
          ({groundStationLink.nextPass.station?.name || 'Station'})
        </span>
      )}
    </div>
  );
}
