import { GraduationCap, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useTutorial } from "@/hooks/use-tutorial"

export function TutorialToggle({ compact = false, className = "" }) {
  const { state, actions, config } = useTutorial()

  const handleStartFlow = (flowId) => {
    actions.startFlow(flowId)
  }

  const handleToggleEnabled = () => {
    actions.setEnabled(!state.enabled)
  }

  const availableFlows = [
    config.globalIntro,
    ...Object.values(config.scenarios).filter(Boolean),
  ].filter(Boolean)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={`relative ${className}`}
        >
          <GraduationCap className="h-4 w-4" />
          {!compact && <span className="ml-2">Tutorial</span>}
          {/* TODO: Re-enable tutorial badge indicator later */}
          {/* {state.enabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )} */}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Tutorials</span>
          <button
            onClick={handleToggleEnabled}
            className={`text-xs px-2 py-0.5 rounded ${
              state.enabled
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {state.enabled ? "ON" : "OFF"}
          </button>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Available tutorials */}
        {state.enabled && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Start a tutorial
            </DropdownMenuLabel>

            {availableFlows.map((flow) => {
              if (!flow) return null
              const isCompleted = state.completedFlows.includes(flow.id)
              const isDismissed = state.dismissedFlows.includes(flow.id)

              return (
                <DropdownMenuItem
                  key={flow.id}
                  onClick={() => handleStartFlow(flow.id)}
                  className="flex items-center justify-between"
                >
                  <span>{flow.title}</span>
                  {isCompleted && (
                    <span className="text-xs text-green-600">Done</span>
                  )}
                  {isDismissed && !isCompleted && (
                    <span className="text-xs text-muted-foreground">Skipped</span>
                  )}
                </DropdownMenuItem>
              )
            })}

            <DropdownMenuSeparator />
          </>
        )}

        {/* Reset progress */}
        <DropdownMenuItem
          onClick={() => actions.resetProgress()}
          className="text-muted-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset all progress
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TutorialToggle
