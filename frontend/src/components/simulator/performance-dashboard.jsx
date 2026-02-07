/**
 * Performance Metrics Dashboard
 * Real-time mission metrics and statistics
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Flame,
  Zap,
  Clock,
  Target,
  TrendingUp,
  Command,
  CheckCircle2
} from 'lucide-react';

export function PerformanceDashboard({ metrics, session }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDeltaV = (ms) => {
    return `${ms.toFixed(1)} m/s`;
  };

  const calculateEfficiency = () => {
    if (!metrics?.deltaVUsed_ms || !metrics?.deltaVBudget_ms) return 0;
    const used = metrics.deltaVUsed_ms;
    const budget = metrics.deltaVBudget_ms;
    return Math.max(0, (1 - used / budget) * 100);
  };

  const stats = [
    {
      label: 'Mission Time',
      value: formatTime(metrics?.elapsedTime || 0),
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      label: 'Commands Executed',
      value: metrics?.commandCount || 0,
      icon: Command,
      color: 'text-green-500'
    },
    {
      label: 'Steps Completed',
      value: `${metrics?.stepsCompleted || 0}/${metrics?.totalSteps || 0}`,
      icon: CheckCircle2,
      color: 'text-purple-500'
    },
    {
      label: 'Delta-V Used',
      value: formatDeltaV(metrics?.deltaVUsed_ms || 0),
      icon: Flame,
      color: 'text-orange-500',
      subtitle: `Budget: ${formatDeltaV(metrics?.deltaVBudget_ms || 300)}`
    },
    {
      label: 'Fuel Efficiency',
      value: `${calculateEfficiency().toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Alerts Triggered',
      value: metrics?.alertsTriggered || 0,
      icon: Activity,
      color: 'text-red-500'
    }
  ];

  return (
    <Card className="p-4 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Performance Metrics</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Live
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-3 rounded-lg bg-muted/30 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bars */}
      <div className="mt-4 space-y-3">
        {/* Mission Progress */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-foreground">
              Mission Progress
            </span>
            <span className="text-xs font-semibold text-foreground">
              {session?.missionProgress || 0}%
            </span>
          </div>
          <Progress value={session?.missionProgress || 0} className="h-2" />
        </div>

        {/* Fuel Remaining */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-foreground">
              Delta-V Remaining
            </span>
            <span className="text-xs font-semibold text-foreground">
              {calculateEfficiency().toFixed(0)}%
            </span>
          </div>
          <Progress
            value={calculateEfficiency()}
            className="h-2"
            indicatorClassName={
              calculateEfficiency() > 50
                ? 'bg-green-500'
                : calculateEfficiency() > 25
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }
          />
        </div>
      </div>
    </Card>
  );
}
