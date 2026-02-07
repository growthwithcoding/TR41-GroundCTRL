import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"

// ============================================================================
// LOCAL STORAGE KEY
// ============================================================================

const STORAGE_KEY = "groundctrl-tutorial-state"

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultUserState = {
  enabled: true,
  completedFlows: [],
  dismissedFlows: [],
  activeFlowId: null,
  activeStepIndex: 0,
  scenarioPreferences: {},
  completedActions: [],
}

// ============================================================================
// CONTEXT
// ============================================================================

const TutorialContext = createContext(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function TutorialProvider({
  children,
  config,
  autoStartIntro = false, // Changed to false by default
}) {
  // Load initial state from localStorage
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return defaultUserState
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...defaultUserState, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn("[Tutorial] Failed to load state from localStorage:", e)
    }
    return defaultUserState
  })

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn("[Tutorial] Failed to save state to localStorage:", e)
    }
  }, [state])

  // Auto-start global intro
  useEffect(() => {
    if (
      autoStartIntro &&
      config.globalIntro &&
      state.enabled &&
      !state.activeFlowId &&
      !state.completedFlows.includes(config.globalIntro.id) &&
      !state.dismissedFlows.includes(config.globalIntro.id)
    ) {
      setState((prev) => ({
        ...prev,
        activeFlowId: config.globalIntro.id,
        activeStepIndex: 0,
      }))
    }
  }, [autoStartIntro, config.globalIntro, state.enabled, state.activeFlowId, state.completedFlows, state.dismissedFlows])

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setEnabled = useCallback((enabled) => {
    setState((prev) => ({
      ...prev,
      enabled,
      activeFlowId: enabled ? prev.activeFlowId : null,
      activeStepIndex: enabled ? prev.activeStepIndex : 0,
    }))
  }, [])

  const startFlow = useCallback((flowId) => {
    setState((prev) => {
      if (prev.dismissedFlows.includes(flowId)) {
        return prev
      }
      return {
        ...prev,
        activeFlowId: flowId,
        activeStepIndex: 0,
      }
    })
  }, [])

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.activeFlowId) return prev

      const flow = findFlow(config, prev.activeFlowId)
      if (!flow) return prev

      const nextIndex = prev.activeStepIndex + 1

      if (nextIndex >= flow.steps.length) {
        return {
          ...prev,
          activeFlowId: null,
          activeStepIndex: 0,
          completedFlows: prev.completedFlows.includes(flow.id)
            ? prev.completedFlows
            : [...prev.completedFlows, flow.id],
        }
      }

      return {
        ...prev,
        activeStepIndex: nextIndex,
      }
    })
  }, [config])

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (!prev.activeFlowId || prev.activeStepIndex <= 0) return prev
      return {
        ...prev,
        activeStepIndex: prev.activeStepIndex - 1,
      }
    })
  }, [])

  const dismissFlow = useCallback((dontShowAgain) => {
    setState((prev) => {
      if (!prev.activeFlowId) return prev
      return {
        ...prev,
        activeFlowId: null,
        activeStepIndex: 0,
        dismissedFlows: dontShowAgain && !prev.dismissedFlows.includes(prev.activeFlowId)
          ? [...prev.dismissedFlows, prev.activeFlowId]
          : prev.dismissedFlows,
      }
    })
  }, [])

  const resetProgress = useCallback(() => {
    setState(defaultUserState)
  }, [])

  // ============================================================================
  // RESOLVED VALUES
  // ============================================================================

  const activeFlow = useMemo(() => {
    if (!state.activeFlowId) return null
    return findFlow(config, state.activeFlowId)
  }, [config, state.activeFlowId])

  const activeStep = useMemo(() => {
    if (!activeFlow) return null
    return activeFlow.steps[state.activeStepIndex] || null
  }, [activeFlow, state.activeStepIndex])

  const isActive = useMemo(() => {
    return state.enabled && activeFlow !== null && activeStep !== null
  }, [state.enabled, activeFlow, activeStep])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const actions = useMemo(
    () => ({
      setEnabled,
      startFlow,
      nextStep,
      prevStep,
      dismissFlow,
      resetProgress,
    }),
    [setEnabled, startFlow, nextStep, prevStep, dismissFlow, resetProgress]
  )

  const value = useMemo(
    () => ({
      state,
      actions,
      config,
      activeFlow,
      activeStep,
      isActive,
    }),
    [state, actions, config, activeFlow, activeStep, isActive]
  )

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return context
}

// ============================================================================
// HELPER: Find flow by ID
// ============================================================================

function findFlow(config, flowId) {
  if (config.globalIntro?.id === flowId) {
    return config.globalIntro
  }

  const scenarioKeys = Object.keys(config.scenarios)
  for (const key of scenarioKeys) {
    if (config.scenarios[key]?.id === flowId) {
      return config.scenarios[key]
    }
  }

  return null
}
