/**
 * Mission Steps Panel
 * Displays current mission objectives and progress
 * Inspired by 3d_view implementation
 */

import React from 'react';
import { useSimulatorState } from '@/contexts/SimulatorStateContext';
import { Check, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function MissionStepsPanel() {
  const { 
    steps, 
    currentStepIndex, 
    missionProgress,
    scenario
  } = useSimulatorState();

  if (!steps || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  const completedCount = steps.filter(s => s.completed).length;

  return (
    <div className="px-4 py-3 border-b border-border bg-muted/30">
      {/* Top Row - Title and Progress */}
      <div className="flex items-center gap-6 mb-2">
        {/* Mission Title */}
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="text-sm font-semibold text-foreground">
            {scenario?.name || 'Mission in Progress'}
          </h2>
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/10 rounded text-[10px] font-mono text-primary">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            ACTIVE
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${missionProgress || 0}%` }} 
            />
          </div>
          <span className="text-[10px] font-mono font-medium text-foreground w-12">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      {/* Bottom Row - Step Indicators and Current Step */}
      <div className="flex items-center gap-3">
        {/* Step Circles */}
        <div className="flex items-center gap-1 shrink-0">
          {steps.map((step, idx) => (
            <div 
              key={step.id || idx} 
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                step.completed 
                  ? "bg-green-600 text-white" 
                  : step.active 
                    ? "bg-primary text-white ring-2 ring-primary/30" 
                    : "border border-muted-foreground/40 text-muted-foreground/60"
              }`}
            >
              {step.completed ? <Check className="w-2.5 h-2.5" /> : idx + 1}
            </div>
          ))}
        </div>

        {/* Current Step Text */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] text-muted-foreground shrink-0 uppercase">Current:</span>
          <span className="text-xs text-foreground truncate">
            {currentStep?.text || "All steps completed! 🎉"}
          </span>
        </div>
      </div>
    </div>
  );
}
