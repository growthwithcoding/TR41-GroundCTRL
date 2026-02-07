/**
 * Alert System Component
 * Displays real-time alerts with severity levels and suggested actions
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  CheckCircle2,
  Flame,
  Droplet,
  Zap,
  Radio
} from 'lucide-react';

const ALERT_ICONS = {
  fuel: Flame,
  power: Zap,
  communications: Radio,
  thermal: Droplet,
  default: AlertCircle
};

export function AlertSystem({ alerts = [], onAcknowledge, onClear }) {
  const [filter, setFilter] = useState('all'); // all, critical, warning, info

  const getAlertIcon = (type, subsystem) => {
    if (type === 'critical') return AlertTriangle;
    if (type === 'info') return Info;
    
    const Icon = ALERT_ICONS[subsystem] || ALERT_ICONS.default;
    return Icon;
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'info':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      default:
        return 'border-border bg-card';
    }
  };

  const getAlertBadgeColor = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-foreground">System Alerts</span>
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unacknowledgedCount} New
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3">
        {['all', 'critical', 'warning', 'info'].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="text-xs capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type, alert.subsystem);
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.type)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <Badge
                      className={`text-xs ${getAlertBadgeColor(alert.type)}`}
                    >
                      {alert.type}
                    </Badge>
                    {alert.subsystem && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {alert.subsystem}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!alert.acknowledged && onAcknowledge && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAcknowledge(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </Button>
                    )}
                    {onClear && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onClear(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-foreground mb-1">
                  {alert.message}
                </p>

                {alert.suggestion && (
                  <div className="mt-2 p-2 bg-background/50 rounded border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      💡 {alert.suggestion.text}
                    </p>
                    {alert.suggestion.command && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs h-7"
                      >
                        Execute {alert.suggestion.command}
                      </Button>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No {filter !== 'all' ? filter : ''} alerts
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
