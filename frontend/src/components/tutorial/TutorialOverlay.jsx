import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, ChevronRight, ChevronLeft, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTutorial } from "@/hooks/use-tutorial"

export function TutorialOverlay() {
  const { isActive, activeFlow, activeStep, state, actions } = useTutorial()
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
  const [targetRect, setTargetRect] = useState(null)
  const panelRef = useRef(null)

  // Handle mount for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        actions.dismissFlow()
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        actions.nextStep()
      } else if (e.key === "ArrowLeft") {
        actions.prevStep()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, actions])

  if (!mounted || !isActive || !activeStep || !activeFlow) {
    return null
  }

  const currentStepIndex = state.activeStepIndex
  const totalSteps = activeFlow.steps.length
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1
  const showBackButton = !isFirstStep
  const showNextButton = true
  const showCloseButton = true

  const blockingMode = activeStep.blockingMode || "semi"
  const bodyContent = Array.isArray(activeStep.body) ? activeStep.body : [activeStep.body]

  return createPortal(
    <div className="fixed inset-0 z-9999 pointer-events-none">
      {/* Backdrop/Overlay */}
      {blockingMode !== "none" && (
        <div
          className={`absolute inset-0 bg-black/60 pointer-events-auto ${blockingMode === "semi" ? 'cursor-pointer' : ''}`}
          onClick={() => blockingMode === "full" ? null : actions.dismissFlow()}
        />
      )}

      {/* Tutorial Panel */}
      <div
        ref={panelRef}
        className="absolute pointer-events-auto w-80 max-w-[90vw] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">{activeFlow.title}</div>
                <div className="text-sm font-semibold text-foreground">{activeStep.title}</div>
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={() => actions.dismissFlow()}
                className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <div className="space-y-2">
              {bodyContent.map((paragraph, i) => (
                <p key={i} className="text-sm text-foreground/90 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStepIndex
                      ? "bg-primary"
                      : i < currentStepIndex
                      ? "bg-primary/40"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-2">
              {showBackButton ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.prevStep()}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <button
                  onClick={() => actions.dismissFlow(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don't show again
                </button>
              )}

              {showNextButton && (
                <Button size="sm" onClick={() => actions.nextStep()}>
                  {isLastStep ? "Got it!" : "Next"}
                  {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              )}
            </div>

            {/* Step counter */}
            <div className="text-center mt-2">
              <span className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TutorialOverlay
