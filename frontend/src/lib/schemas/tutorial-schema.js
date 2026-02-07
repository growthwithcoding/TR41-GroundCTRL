/**
 * Tutorial System Schema Definitions
 * JSDoc type definitions for the tutorial overlay system
 * 
 * @fileoverview Type definitions for tutorial flows, steps, and user progress tracking
 */

// ============================================================================
// TARGET & POSITIONING TYPES
// ============================================================================

/**
 * Tutorial target types - how to locate the UI element
 * @typedef {Object} TutorialTargetElementId
 * @property {'elementId'} type
 * @property {string} id - Element ID (without #)
 */

/**
 * @typedef {Object} TutorialTargetSelector
 * @property {'selector'} type
 * @property {string} value - CSS selector
 */

/**
 * @typedef {Object} TutorialTargetRegion
 * @property {'region'} type
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} w - Width
 * @property {number} h - Height
 * @property {'px'|'%'} units - Unit type
 */

/**
 * @typedef {Object} TutorialTargetViewportCenter
 * @property {'viewportCenter'} type
 */

/**
 * Tutorial target - defines where to point the tutorial
 * @typedef {TutorialTargetElementId|TutorialTargetSelector|TutorialTargetRegion|TutorialTargetViewportCenter} TutorialTarget
 */

/**
 * Tutorial panel placement relative to target
 * @typedef {'top'|'top-start'|'top-end'|'bottom'|'bottom-start'|'bottom-end'|'left'|'left-start'|'left-end'|'right'|'right-start'|'right-end'|'center'} TutorialPlacement
 */

// ============================================================================
// HIGHLIGHT & INTERACTION TYPES
// ============================================================================

/**
 * Highlight options for the target element
 * @typedef {Object} HighlightOptions
 * @property {boolean} [pulse] - Add pulsing glow effect
 * @property {string} [borderColor] - Border color for spotlight
 * @property {number} [padding] - Padding around highlighted element (px)
 * @property {number} [borderRadius] - Border radius for spotlight cutout (px)
 */

/**
 * Blocking modes for overlay behavior
 * @typedef {'none'|'semi'|'full'} BlockingMode
 * - none: No backdrop, click-through
 * - semi: Backdrop with spotlight on target, can click target
 * - full: Full backdrop, must interact with tutorial
 */

/**
 * Dismiss behavior when closing a step
 * @typedef {'dismissStep'|'dismissFlow'} DismissBehavior
 * - dismissStep: Only close this step, move to next
 * - dismissFlow: Close entire flow
 */

/**
 * Auto-advance conditions
 * @typedef {'none'|'clickTarget'|'actionCompleted'} AutoAdvanceCondition
 */

// ============================================================================
// CONDITIONS TYPES
// ============================================================================

/**
 * Conditional display logic for tutorial steps
 * @typedef {Object} TutorialCondition
 * @property {string} [elementExists] - Only show if this selector exists
 * @property {string} [localStorageKey] - Only show if this localStorage key matches value
 * @property {string} [localStorageValue] - Expected localStorage value
 * @property {string} [actionNotCompleted] - Only show if action ID not completed
 * @property {string} [customCondition] - Custom condition function name
 */

// ============================================================================
// TUTORIAL STEP TYPE
// ============================================================================

/**
 * A single step in a tutorial flow
 * @typedef {Object} TutorialStep
 * @property {string} id - Unique identifier for this step
 * @property {string} title - Title displayed at top of panel
 * @property {string|string[]} body - Body content (string or array of paragraphs)
 * @property {ScenarioKey} scenarioKey - Which scenario this step belongs to
 * 
 * @property {TutorialTarget} target - Target element or region to anchor to
 * @property {TutorialPlacement} placement - Panel placement relative to target
 * @property {[number, number]} [offset] - Offset from calculated position [x, y] in pixels
 * 
 * @property {HighlightOptions} [highlight] - Spotlight/highlight options
 * @property {BlockingMode} [blockingMode] - How much to block user interaction
 * @property {boolean} [showCloseButton] - Show close (X) button (default: true)
 * @property {boolean} [showNextButton] - Show "Next" button (default: true)
 * @property {boolean} [showBackButton] - Show "Back" button (default: false for first step)
 * 
 * @property {string} [nextButtonText] - Custom next button text
 * @property {string} [backButtonText] - Custom back button text
 * 
 * @property {DismissBehavior} [dismissBehavior] - What happens when user clicks close
 * @property {AutoAdvanceCondition} [autoAdvanceOn] - Automatically advance when condition met
 * @property {string} [autoAdvanceAction] - Action ID to watch for auto-advance
 * @property {TutorialCondition} [condition] - Conditional display logic
 * @property {number} [delay] - Delay before showing this step (ms)
 * 
 * @property {string} [image] - Optional image URL
 * @property {string} [video] - Optional video URL
 * @property {string} [icon] - Icon name from lucide-react
 */

// ============================================================================
// TUTORIAL FLOW TYPE
// ============================================================================

/**
 * A complete tutorial flow (sequence of steps)
 * @typedef {Object} TutorialFlow
 * @property {string} id - Unique identifier
 * @property {string} title - Display title for this flow
 * @property {string} [description] - Optional description
 * @property {TutorialStep[]} steps - Ordered list of steps
 * @property {boolean} [showOncePerUser] - Only show this flow once per user
 * @property {number} [priority] - Priority for display ordering
 */

// ============================================================================
// SCENARIO TYPES
// ============================================================================

/**
 * Available simulator scenarios
 * @typedef {'global'|'command'|'orbit'|'telemetry'|'communications'|'mission'|'nova'|'rendering-2d'|'rendering-3d'} ScenarioKey
 */

/**
 * Scenario metadata
 * @typedef {Object} ScenarioInfo
 * @property {ScenarioKey} key - Scenario key
 * @property {string} name - Display name
 * @property {string} description - Description
 * @property {string} primaryTarget - Primary UI target selector
 */

// ============================================================================
// CONFIGURATION TYPE
// ============================================================================

/**
 * Top-level tutorial configuration
 * @typedef {Object} TutorialConfig
 * @property {TutorialFlow} [globalIntro] - Global intro shown once per session
 * @property {Record<ScenarioKey, TutorialFlow>} scenarios - Scenario-specific tutorial flows
 * @property {Object} [defaults] - Default settings
 * @property {BlockingMode} [defaults.blockingMode] - Default blocking mode
 * @property {boolean} [defaults.showCloseButton] - Default show close button
 * @property {number} [defaults.highlightPadding] - Default highlight padding
 */

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * User's tutorial progress and preferences
 * @typedef {Object} TutorialUserState
 * @property {boolean} enabled - Is tutorial system enabled
 * @property {string[]} completedFlows - Completed flow IDs
 * @property {string[]} dismissedFlows - Dismissed flow IDs ("Don't show again")
 * @property {string|null} activeFlowId - Current flow being viewed
 * @property {number} activeStepIndex - Current step index within active flow
 * @property {Partial<Record<ScenarioKey, boolean>>} scenarioPreferences - Per-scenario "don't show again" settings
 * @property {string[]} completedActions - Completed action IDs (for conditional logic)
 */

/**
 * Tutorial context actions
 * @typedef {Object} TutorialActions
 * @property {(enabled: boolean) => void} setEnabled - Enable/disable entire tutorial system
 * @property {(flowId: string) => void} startFlow - Start a specific tutorial flow
 * @property {() => void} nextStep - Go to next step in current flow
 * @property {() => void} prevStep - Go to previous step in current flow
 * @property {(index: number) => void} goToStep - Jump to specific step
 * @property {() => void} dismissStep - Dismiss current step
 * @property {(dontShowAgain?: boolean) => void} dismissFlow - Dismiss entire flow
 * @property {(actionId: string) => void} completeAction - Mark an action as completed
 * @property {(scenario: ScenarioKey, showTutorials: boolean) => void} setScenarioPreference - Set scenario preference
 * @property {() => void} resetProgress - Reset all progress
 */

/**
 * Complete tutorial context value
 * @typedef {Object} TutorialContextValue
 * @property {TutorialUserState} state - Current user state
 * @property {TutorialActions} actions - Available actions
 * @property {TutorialConfig} config - Tutorial configuration
 * @property {TutorialFlow|null} activeFlow - Currently active flow (resolved)
 * @property {TutorialStep|null} activeStep - Currently active step (resolved)
 * @property {boolean} isActive - Is currently showing a tutorial
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Calculated position for overlay rendering
 * @typedef {Object} CalculatedPosition
 * @property {number} top - Top position (px)
 * @property {number} left - Left position (px)
 * @property {string} transformOrigin - CSS transform-origin value
 * @property {'top'|'bottom'|'left'|'right'|'none'} arrowPosition - Arrow pointer position
 * @property {number} arrowOffset - Arrow offset from center (px)
 */

/**
 * Target element rect with additional info
 * @typedef {Object} TargetRect
 * @property {number} top - Top position (px)
 * @property {number} left - Left position (px)
 * @property {number} width - Width (px)
 * @property {number} height - Height (px)
 * @property {boolean} visible - Whether element is visible
 */

// ============================================================================
// EXPORTS (for IDE support)
// ============================================================================

// Export an empty object to make this a module
export {};
