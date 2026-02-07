/**
 * GroundCTRL Tutorial Configuration
 * 
 * Defines all tutorial flows and steps for the simulator
 */

// ============================================================================
// GLOBAL INTRO FLOW
// ============================================================================

const globalIntroFlow = {
  id: "global-intro",
  title: "Welcome to GroundCTRL",
  description: "A quick introduction to the satellite simulator",
  showOncePerUser: true,
  priority: 100,
  steps: [
    {
      id: "intro-welcome",
      title: "Welcome, Operator",
      body: [
        "Welcome to GroundCTRL Mission Control. This simulator lets you learn real satellite operations in a safe environment.",
        "You'll track orbits, execute commands, and communicate with spacecraft - just like a real mission controller.",
      ],
      scenarioKey: "global",
      target: { type: "viewportCenter" },
      placement: "center",
      blockingMode: "full",
      highlight: { pulse: true },
    },
    {
      id: "intro-layout",
      title: "Simulator Layout",
      body: "The simulator has three main areas: Nova AI Assistant (left), Mission View (center), and Command Console (right). Let's explore each one.",
      scenarioKey: "global",
      target: { type: "viewportCenter" },
      placement: "center",
      blockingMode: "semi",
    },
    {
      id: "intro-complete",
      title: "You're Ready!",
      body: [
        "That's the basics! Toggle between 2D map and 3D globe views to track your satellite.",
        "Your mission: Complete the objectives shown at the bottom. Good luck, operator!",
      ],
      scenarioKey: "global",
      target: { type: "viewportCenter" },
      placement: "center",
      blockingMode: "full",
      nextButtonText: "Start Mission",
    },
  ],
}

// ============================================================================
// ORBIT SCENARIO FLOW
// ============================================================================

const orbitFlow = {
  id: "orbit-tutorial",
  title: "Orbit Visualization",
  description: "Understanding your satellite's orbital path",
  steps: [
    {
      id: "orbit-intro",
      title: "Satellite Visualization",
      body: "This view shows your satellite's position in real-time. You can toggle between 2D flat map and 3D globe views using the button at the bottom left.",
      scenarioKey: "orbit",
      target: { type: "viewportCenter" },
      placement: "center",
      blockingMode: "semi",
    },
    {
      id: "orbit-2d",
      title: "2D Ground Track",
      body: [
        "The 2D view shows your satellite's ground track - the path it traces over Earth's surface. The sinusoidal curve is characteristic of inclined orbits.",
        "Green circles mark ground stations where you can communicate with your satellite.",
      ],
      scenarioKey: "orbit",
      target: { type: "viewportCenter" },
      placement: "center",
      blockingMode: "semi",
    },
    {
      id: "orbit-3d",
      title: "3D Globe View",
      body: [
        "Switch to 3D view to see your satellite orbiting Earth in three dimensions. Drag to rotate, scroll to zoom.",
        "Use the 'FOLLOW SAT' button to track the satellite with the camera.",
      ],
      scenarioKey: "orbit",
      target: { type: "viewportCenter" },
      placement: "center",
      blockingMode: "semi",
      nextButtonText: "Got it!",
    },
  ],
}

// ============================================================================
// COMPLETE TUTORIAL CONFIGURATION
// ============================================================================

export const tutorialConfig = {
  globalIntro: globalIntroFlow,
  scenarios: {
    // Note: globalIntroFlow is already available via globalIntro, no need to duplicate in scenarios
    orbit: orbitFlow,
    command: null,
    telemetry: null,
    communications: null,
    nova: null,
    mission: null,
  },
  defaults: {
    blockingMode: "semi",
    showCloseButton: true,
    highlightPadding: 8,
  },
}

export {
  globalIntroFlow,
  orbitFlow,
}
