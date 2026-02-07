/**
 * CommandButton Component
 * For commands with no parameters - single click execution
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';

export function CommandButton({ 
  name, 
  icon,
  enabled = true,
  executing = false,
  completed = false,
  failed = false,
  disabledReason,
  onExecute 
}) {
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (completed) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [completed]);

  const buttonContent = (
    <Button
      onClick={onExecute}
      disabled={!enabled || executing}
      className={`w-full h-auto py-3 px-4 ${
        showSuccess ? 'bg-green-600 hover:bg-green-700' :
        failed ? 'bg-red-600 hover:bg-red-700' :
        !enabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
        'bg-blue-600 hover:bg-blue-700'
      } text-white font-semibold transition-colors`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {!enabled && <Lock className="w-4 h-4" />}
          {executing && <Loader2 className="w-4 h-4 animate-spin" />}
          {showSuccess && <CheckCircle2 className="w-4 h-4" />}
          {failed && <AlertCircle className="w-4 h-4" />}
          {icon && <span className="w-4 h-4">{icon}</span>}
          <span className="text-sm">{name.replace(/_/g, ' ')}</span>
        </div>
        {executing && <span className="text-xs">Executing...</span>}
        {showSuccess && <span className="text-xs">Complete ✓</span>}
        {failed && <span className="text-xs">Failed ⚠</span>}
      </div>
    </Button>
  );

  if (!enabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">🔒 {name}</p>
              <p className="text-xs text-muted-foreground">{disabledReason}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}
