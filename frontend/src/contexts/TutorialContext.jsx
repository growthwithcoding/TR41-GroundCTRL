/**
 * TutorialContext - Global tutorial state management
 * 
 * Provides tutorial system state and actions throughout the app
 * Syncs progress with Firestore for persistence across sessions
 * 
 * @context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  loadTutorialProgress,
  syncTutorialState,
  markFlowCompleted as markFlowCompletedService,
  markFlowDismissed as markFlowDismissedService,
  updateScenarioPreference as updateScenarioPrefService
} from '../lib/firebase/tutorialService';

// Tutorial configuration will be imported from separate config file
import { tutorialConfig } from '../config/tutorials';

const TutorialContext = createContext(null);

/**
 * Tutorial state shape
 * @typedef {Object} TutorialState
 * @property {boolean} enabled - Whether tutorials are enabled globally
 * @property {string[]} completedFlows - Array of completed flow IDs
 * @property {string[]} dismissedFlows - Array of dismissed flow IDs
 * @property {string|null} activeFlowId - Currently active flow ID
 * @property {number} activeStepIndex - Current step index in active flow
 * @property {Object} scenarioPreferences - Per-scenario "show tutorials" preferences
 * @property {string[]} completedActions - Completed action IDs for conditional logic
 * @property {boolean} isLoading - Whether initial load is in progress
 */

export function TutorialProvider({ children }) {
  const { user } = useAuth();
  
  const [state, setState] = useState({
    enabled: true,
    completedFlows: [],
    dismissedFlows: [],
    activeFlowId: null,
    activeStepIndex: 0,
    scenarioPreferences: {},
    completedActions: [],
    isLoading: true
  });

  // Load tutorial progress from Firestore on mount
  useEffect(() => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    loadTutorialProgress(user.uid)
      .then(progress => {
        if (progress) {
          setState(prev => ({
            ...prev,
            enabled: progress.enabled ?? true,
            completedFlows: progress.completedFlows ?? [],
            dismissedFlows: progress.dismissedFlows ?? [],
            scenarioPreferences: progress.scenarioPreferences ?? {},
            activeFlowId: progress.lastActiveFlow ?? null,
            activeStepIndex: progress.lastActiveStepIndex ?? 0,
            isLoading: false
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      })
      .catch(error => {
        console.error('[TutorialContext] Error loading progress:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      });
  }, [user]);

  // Sync state to Firestore when it changes (debounced)
  useEffect(() => {
    if (!user?.uid || state.isLoading) return;

    const timeoutId = setTimeout(() => {
      syncTutorialState(user.uid, state).catch(error => {
        console.warn('[TutorialContext] Sync error:', error);
      });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [user, state]);

  // Get active flow object
  const activeFlow = state.activeFlowId 
    ? tutorialConfig.scenarios[state.activeFlowId] || 
      (state.activeFlowId === 'globalIntro' ? tutorialConfig.globalIntro : null)
    : null;

  // Get active step object
  const activeStep = activeFlow?.steps?.[state.activeStepIndex] || null;

  // Check if currently showing a tutorial
  const isActive = !!(state.enabled && activeFlow && activeStep);

  // Actions
  const actions = {
    /**
     * Enable or disable the entire tutorial system
     */
    setEnabled: useCallback((enabled) => {
      setState(prev => ({
        ...prev,
        enabled,
        activeFlowId: enabled ? prev.activeFlowId : null,
        activeStepIndex: enabled ? prev.activeStepIndex : 0
      }));
    }, []),

    /**
     * Start a tutorial flow
     */
    startFlow: useCallback((flowId) => {
      const flow = tutorialConfig.scenarios[flowId] || 
                   (flowId === 'globalIntro' ? tutorialConfig.globalIntro : null);
      
      if (!flow) {
        console.warn(`[TutorialContext] Flow "${flowId}" not found`);
        return;
      }

      // Check if already completed or dismissed
      if (state.completedFlows.includes(flowId)) {
        console.log(`[TutorialContext] Flow "${flowId}" already completed`);
        return;
      }

      if (state.dismissedFlows.includes(flowId)) {
        console.log(`[TutorialContext] Flow "${flowId}" was dismissed`);
        return;
      }

      // Check showOncePerUser
      if (flow.showOncePerUser && state.completedFlows.includes(flowId)) {
        return;
      }

      setState(prev => ({
        ...prev,
        activeFlowId: flowId,
        activeStepIndex: 0
      }));

      console.log(`[TutorialContext] Started flow "${flowId}"`);
    }, [state.completedFlows, state.dismissedFlows]),

    /**
     * Go to next step in current flow
     */
    nextStep: useCallback(() => {
      if (!activeFlow || !activeStep) return;

      const nextIndex = state.activeStepIndex + 1;
      
      if (nextIndex >= activeFlow.steps.length) {
        // Flow completed
        actions.completeFlow();
      } else {
        setState(prev => ({
          ...prev,
          activeStepIndex: nextIndex
        }));
      }
    }, [activeFlow, activeStep, state.activeStepIndex]),

    /**
     * Go to previous step
     */
    prevStep: useCallback(() => {
      if (!activeFlow || state.activeStepIndex === 0) return;

      setState(prev => ({
        ...prev,
        activeStepIndex: Math.max(0, prev.activeStepIndex - 1)
      }));
    }, [activeFlow, state.activeStepIndex]),

    /**
     * Jump to specific step
     */
    goToStep: useCallback((index) => {
      if (!activeFlow) return;
      if (index < 0 || index >= activeFlow.steps.length) return;

      setState(prev => ({
        ...prev,
        activeStepIndex: index
      }));
    }, [activeFlow]),

    /**
     * Dismiss current step (move to next or close)
     */
    dismissStep: useCallback(() => {
      if (!activeStep) return;

      const dismissBehavior = activeStep.dismissBehavior || 'dismissStep';
      
      if (dismissBehavior === 'dismissFlow') {
        actions.dismissFlow(false);
      } else {
        actions.nextStep();
      }
    }, [activeStep]),

    /**
     * Dismiss entire flow
     */
    dismissFlow: useCallback((dontShowAgain = false) => {
      if (!state.activeFlowId) return;

      const flowId = state.activeFlowId;

      setState(prev => ({
        ...prev,
        activeFlowId: null,
        activeStepIndex: 0,
        dismissedFlows: dontShowAgain 
          ? [...prev.dismissedFlows, flowId]
          : prev.dismissedFlows
      }));

      // Mark as dismissed in Firestore
      if (dontShowAgain && user?.uid) {
        markFlowDismissedService(user.uid, flowId).catch(console.error);
      }

      console.log(`[TutorialContext] Dismissed flow "${flowId}"${dontShowAgain ? ' (permanently)' : ''}`);
    }, [state.activeFlowId, user]),

    /**
     * Complete current flow
     */
    completeFlow: useCallback(() => {
      if (!state.activeFlowId) return;

      const flowId = state.activeFlowId;

      setState(prev => ({
        ...prev,
        activeFlowId: null,
        activeStepIndex: 0,
        completedFlows: [...prev.completedFlows, flowId]
      }));

      // Mark as completed in Firestore
      if (user?.uid) {
        markFlowCompletedService(user.uid, flowId).catch(console.error);
      }

      console.log(`[TutorialContext] Completed flow "${flowId}"`);
    }, [state.activeFlowId, user]),

    /**
     * Mark an action as completed (for conditional logic)
     */
    completeAction: useCallback((actionId) => {
      setState(prev => ({
        ...prev,
        completedActions: prev.completedActions.includes(actionId)
          ? prev.completedActions
          : [...prev.completedActions, actionId]
      }));
    }, []),

    /**
     * Set scenario preference
     */
    setScenarioPreference: useCallback((scenarioKey, showTutorials) => {
      setState(prev => ({
        ...prev,
        scenarioPreferences: {
          ...prev.scenarioPreferences,
          [scenarioKey]: showTutorials
        }
      }));

      // Update in Firestore
      if (user?.uid) {
        updateScenarioPrefService(user.uid, scenarioKey, showTutorials).catch(console.error);
      }
    }, [user]),

    /**
     * Reset all tutorial progress
     */
    resetProgress: useCallback(() => {
      setState({
        enabled: true,
        completedFlows: [],
        dismissedFlows: [],
        activeFlowId: null,
        activeStepIndex: 0,
        scenarioPreferences: {},
        completedActions: [],
        isLoading: false
      });

      console.log('[TutorialContext] Progress reset');
    }, []),

    /**
     * Check if action is completed
     */
    isActionCompleted: useCallback((actionId) => {
      return state.completedActions.includes(actionId);
    }, [state.completedActions]),

    /**
     * Check if flow is completed
     */
    isFlowCompleted: useCallback((flowId) => {
      return state.completedFlows.includes(flowId);
    }, [state.completedFlows]),

    /**
     * Check if flow is dismissed
     */
    isFlowDismissed: useCallback((flowId) => {
      return state.dismissedFlows.includes(flowId);
    }, [state.dismissedFlows])
  };

  const value = {
    state,
    actions,
    config: tutorialConfig,
    activeFlow,
    activeStep,
    isActive
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

/**
 * Hook to use tutorial context
 */
export function useTutorial() {
  const context = useContext(TutorialContext);
  
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  
  return context;
}

/**
 * Hook for scenario-specific tutorials
 * Auto-starts tutorial for scenario if not completed
 */
export function useScenarioTutorial(scenarioKey) {
  const { state, actions, config } = useTutorial();
  
  useEffect(() => {
    if (!state.enabled) return;
    
    // Check if scenario has tutorials
    const flow = config.scenarios[scenarioKey];
    if (!flow) return;
    
    // Check if already completed or dismissed
    if (state.completedFlows.includes(scenarioKey)) return;
    if (state.dismissedFlows.includes(scenarioKey)) return;
    
    // Check user preference for this scenario
    if (state.scenarioPreferences[scenarioKey] === false) return;
    
    // Auto-start tutorial after brief delay
    const timeoutId = setTimeout(() => {
      actions.startFlow(scenarioKey);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [scenarioKey, state.enabled, state.completedFlows, state.dismissedFlows, 
      state.scenarioPreferences, config, actions]);
  
  return {
    isActive: state.activeFlowId === scenarioKey,
    start: () => actions.startFlow(scenarioKey),
    dismiss: (permanent) => actions.dismissFlow(permanent)
  };
}

export default TutorialContext;
