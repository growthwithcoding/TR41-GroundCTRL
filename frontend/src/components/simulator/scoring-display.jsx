/**
 * Scoring Display Panel
 * Real-time scoring with multi-dimensional breakdown
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, Shield, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ScoringDisplay({ score, achievements = [] }) {
  if (!score) {
    return null;
  }

  const getGradeColor = (total) => {
    if (total >= 95) return 'text-yellow-500'; // S
    if (total >= 85) return 'text-green-500'; // A
    if (total >= 75) return 'text-blue-500'; // B
    if (total >= 60) return 'text-purple-500'; // C
    if (total >= 50) return 'text-orange-500'; // D
    return 'text-red-500'; // F
  };

  const getGrade = (total) => {
    if (total >= 95) return 'S';
    if (total >= 85) return 'A';
    if (total >= 75) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    return 'F';
  };

  const breakdown = score.breakdown || {
    coverage: 0,
    efficiency: 0,
    safety: 0,
    timing: 0
  };

  const dimensions = [
    {
      name: 'Coverage',
      icon: Target,
      value: breakdown.coverage,
      color: 'bg-blue-500',
      description: 'Objectives completed'
    },
    {
      name: 'Efficiency',
      icon: Zap,
      value: breakdown.efficiency,
      color: 'bg-green-500',
      description: 'Resource optimization'
    },
    {
      name: 'Safety',
      icon: Shield,
      value: breakdown.safety,
      color: 'bg-purple-500',
      description: 'Violations avoided'
    },
    {
      name: 'Timing',
      icon: Clock,
      value: breakdown.timing,
      color: 'bg-orange-500',
      description: 'Precision and accuracy'
    }
  ];

  return (
    <Card className="p-4 bg-card border-border">
      {/* Overall Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-foreground">Mission Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${getGradeColor(score.total)}`}>
            {getGrade(score.total)}
          </span>
          <span className="text-2xl font-semibold text-foreground">
            {score.total}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={score.total} className="mb-4 h-2" />

      {/* Dimension Breakdown */}
      <div className="space-y-3">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          return (
            <TooltipProvider key={dim.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-foreground">
                          {dim.name}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {dim.value}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`${dim.color} h-1.5 rounded-full transition-all`}
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{dim.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-foreground">
              Achievements
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {achievements.map((achievement) => (
              <Badge key={achievement} variant="secondary" className="text-xs">
                {achievement.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
