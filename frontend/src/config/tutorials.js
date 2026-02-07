/**
 * Tutorial Configuration
 * 
 * Defines all tutorial flows and steps for GroundCTRL
 * Organized by scenario/feature area
 * 
 * @see frontend/src/lib/schemas/tutorial-schema.js for type definitions
 */

export const tutorialConfig = {
  // Global intro tutorial (shown once on first login)
  globalIntro: {
    id: 'globalIntro',
    title: 'Welcome to GroundCTRL! 🚀',
    description: 'Your mission control training platform',
    showOncePerUser: true,
    priority: 100,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Mission Specialist!',
        body: [
          'Welcome to GroundCTRL - your comprehensive satellite operations training platform.',
          'This tutorial will guide you through the essential features to get you started on your mission.'
        ],
        scenarioKey: 'global',
        target: { type: 'viewportCenter' },
        placement: 'center',
        blockingMode: 'full',
        showBackButton: false,
        icon: 'rocket'
      },
      {
        id: 'navigation',
        title: 'Navigation',
        body: [
          'Use the sidebar to navigate between different sections:',
          '• Dashboard - Mission overview',
          '• Scenarios - Training missions',
          '• Mission Control - Live operations',
          '• Nova AI - Your AI assistant'
        ],
        scenarioKey: 'global',
        target: { type: 'selector', value: 'nav' },
        placement: 'right',
        highlight: { pulse: true, padding: 12 }
      },
      {
        id: 'help',
        title: 'Help & Tutorials',
        body: [
          'Access tutorials anytime from the help menu.',
          'Press ? to toggle tutorial hints on any page.'
        ],
        scenarioKey: 'global',
        target: { type: 'selector', value: '[data-tutorial="help-menu"]' },
        placement: 'bottom',
        nextButtonText: 'Let\'s Go! 🚀'
      }
    ]
  },

  // Scenario-specific tutorials
  scenarios: {
    // 2D Rendering Tutorial
    'rendering-2d': {
      id: 'rendering-2d',
      title: '2D Satellite View Tutorial',
      description: 'Learn how to use the 2D orbital map',
      steps: [
        {
          id: '2d-intro',
          title: 'Welcome to 2D View 🗺️',
          body: [
            'This is the 2D satellite visualization - a flat map projection showing your satellite\'s orbit.',
            'It uses a sinusoidal projection to accurately represent orbital tracks on Earth\'s surface.'
          ],
          scenarioKey: 'rendering-2d',
          target: { type: 'selector', value: '.satellite-canvas-2d' },
          placement: 'center',
          blockingMode: 'semi',
          showBackButton: false
        },
        {
          id: '2d-satellite',
          title: 'Satellite Position',
          body: [
            'The red dot shows your satellite\'s current position.',
            'The altitude is displayed next to the marker.'
          ],
          scenarioKey: 'rendering-2d',
          target: { type: 'selector', value: '.satellite-canvas-2d canvas' },
          placement: 'right',
          highlight: { pulse: true }
        },
        {
          id: '2d-groundtrack',
          title: 'Ground Track',
          body: [
            'The blue line shows where your satellite travels over Earth.',
            'This is the ground track - the path directly below the satellite.'
          ],
          scenarioKey: 'rendering-2d',
          target: { type: 'selector', value: '.satellite-canvas-2d canvas' },
          placement: 'right'
        },
        {
          id: '2d-terminator',
          title: 'Day/Night Boundary',
          body: [
            'The glowing line shows the day/night terminator.',
            'This helps you understand when your satellite is in sunlight or shadow.'
          ],
          scenarioKey: 'rendering-2d',
          target: { type: 'selector', value: '.satellite-canvas-2d canvas' },
          placement: 'bottom'
        },
        {
          id: '2d-controls',
          title: 'Playback Controls',
          body: [
            'Use these controls to pause, play, or reset the simulation.',
            'Time is accelerated to show orbital motion clearly.'
          ],
          scenarioKey: 'rendering-2d',
          target: { type: 'selector', value: '.satellite-canvas-2d button' },
          placement: 'top',
          highlight: { pulse: true, padding: 8 }
        }
      ]
    },

    // 3D Globe Tutorial
    'rendering-3d': {
      id: 'rendering-3d',
      title: '3D Globe View Tutorial',
      description: 'Master the 3D interactive globe',
      steps: [
        {
          id: '3d-intro',
          title: 'Welcome to 3D View 🌍',
          body: [
            'This is the 3D globe visualization - an interactive view of Earth and your satellite.',
            'You can rotate, zoom, and explore from any angle.'
          ],
          scenarioKey: 'rendering-3d',
          target: { type: 'selector', value: '.satellite-globe-3d' },
          placement: 'center',
          blockingMode: 'semi',
          showBackButton: false
        },
        {
          id: '3d-controls',
          title: 'Camera Controls',
          body: [
            'Left-click and drag to rotate the view.',
            'Right-click and drag to pan.',
            'Scroll to zoom in and out.'
          ],
          scenarioKey: 'rendering-3d',
          target: { type: 'selector', value: '.satellite-globe-3d canvas' },
          placement: 'right',
          autoAdvanceOn: 'clickTarget'
        },
        {
          id: '3d-satellite',
          title: 'Satellite in 3D',
          body: [
            'The glowing red sphere is your satellite.',
            'It moves along its orbital path in real-time.'
          ],
          scenarioKey: 'rendering-3d',
          target: { type: 'selector', value: '.satellite-globe-3d canvas' },
          placement: 'bottom'
        },
        {
          id: '3d-orbit',
          title: 'Orbital Path',
          body: [
            'The cyan line shows the complete orbital path.',
            'This helps visualize the satellite\'s trajectory through space.'
          ],
          scenarioKey: 'rendering-3d',
          target: { type: 'selector', value: '.satellite-globe-3d canvas' },
          placement: 'left'
        },
        {
          id: '3d-reset',
          title: 'Reset View',
          body: [
            'Click "Reset View" to return to the default camera position.',
            'Useful if you get lost while exploring!'
          ],
          scenarioKey: 'rendering-3d',
          target: { type: 'selector', value: '[data-tutorial="reset-view"]' },
          placement: 'top',
          highlight: { pulse: true }
        }
      ]
    },

    // View Switcher Tutorial
    'view-switcher': {
      id: 'view-switcher',
      title: 'Switching Between Views',
      description: 'Learn to toggle 2D and 3D modes',
      steps: [
        {
          id: 'switcher-intro',
          title: 'View Modes 🔄',
          body: [
            'You can switch between 2D map view and 3D globe view anytime.',
            'Each view has its own advantages for different tasks.'
          ],
          scenarioKey: 'global',
          target: { type: 'selector', value: '.satellite-view-switcher' },
          placement: 'center',
          blockingMode: 'semi'
        },
        {
          id: 'switcher-buttons',
          title: 'View Toggle Buttons',
          body: [
            'Click these buttons to switch between views.',
            'Your preference is automatically saved.'
          ],
          scenarioKey: 'global',
          target: { type: 'selector', value: '.satellite-view-switcher button' },
          placement: 'bottom-start',
          highlight: { pulse: true, padding: 8 }
        },
        {
          id: 'switcher-keyboard',
          title: 'Keyboard Shortcut',
          body: [
            'Pro tip: Press "V" to quickly toggle between views.',
            'This works on any page with satellite visualization.'
          ],
          scenarioKey: 'global',
          target: { type: 'selector', value: '.satellite-view-switcher' },
          placement: 'center',
          nextButtonText: 'Got it!'
        }
      ]
    },

    // Mission Control Tutorial
    'mission-control': {
      id: 'mission-control',
      title: 'Mission Control Operations',
      description: 'Learn the mission control interface',
      steps: [
        {
          id: 'mc-intro',
          title: 'Mission Control 🎮',
          body: [
            'Welcome to Mission Control - your command center for satellite operations.',
            'Here you can monitor telemetry, send commands, and track your mission.'
          ],
          scenarioKey: 'mission',
          target: { type: 'viewportCenter' },
          placement: 'center',
          blockingMode: 'full',
          showBackButton: false
        },
        {
          id: 'mc-telemetry',
          title: 'Telemetry Panel',
          body: [
            'This panel shows real-time satellite data:',
            '• Power levels',
            '• Attitude information',
            '• Thermal status',
            '• Communications link'
          ],
          scenarioKey: 'mission',
          target: { type: 'selector', value: '[data-tutorial="telemetry"]' },
          placement: 'right',
          highlight: { pulse: true }
        },
        {
          id: 'mc-commands',
          title: 'Command Console',
          body: [
            'Use this console to send commands to your satellite.',
            'Commands are queued and executed when the satellite is in communication range.'
          ],
          scenarioKey: 'mission',
          target: { type: 'selector', value: '[data-tutorial="commands"]' },
          placement: 'left',
          highlight: { padding: 12 }
        },
        {
          id: 'mc-visualization',
          title: 'Orbital Visualization',
          body: [
            'The orbital view shows your satellite\'s position and ground track.',
            'Toggle between 2D and 3D views for different perspectives.'
          ],
          scenarioKey: 'mission',
          target: { type: 'selector', value: '[data-tutorial="orbit-view"]' },
          placement: 'bottom'
        }
      ]
    },

    // Nova AI Tutorial
    'nova-ai': {
      id: 'nova-ai',
      title: 'Nova AI Assistant',
      description: 'Learn to work with Nova AI',
      steps: [
        {
          id: 'nova-intro',
          title: 'Meet Nova 🤖',
          body: [
            'Nova is your AI assistant for satellite operations.',
            'Ask questions, get help, or request mission analysis.'
          ],
          scenarioKey: 'nova',
          target: { type: 'selector', value: '[data-tutorial="nova-chat"]' },
          placement: 'center',
          showBackButton: false
        },
        {
          id: 'nova-ask',
          title: 'Ask Questions',
          body: [
            'Type your question in the chat box.',
            'Nova can explain concepts, help troubleshoot, and provide mission insights.'
          ],
          scenarioKey: 'nova',
          target: { type: 'selector', value: '[data-tutorial="nova-input"]' },
          placement: 'top',
          highlight: { pulse: true }
        },
        {
          id: 'nova-modes',
          title: 'Nova Modes',
          body: [
            'Nova has different modes:',
            '• Chat - General questions and help',
            '• Analysis - Mission data analysis',
            '• Training - Learning resources'
          ],
          scenarioKey: 'nova',
          target: { type: 'selector', value: '[data-tutorial="nova-modes"]' },
          placement: 'right'
        }
      ]
    },

    // Scenario Training
    'scenario-training': {
      id: 'scenario-training',
      title: 'Training Scenarios',
      description: 'How to complete training missions',
      steps: [
        {
          id: 'scenario-intro',
          title: 'Training Missions 📚',
          body: [
            'Scenarios are step-by-step training missions.',
            'Complete them to earn badges and advance through the ranks!'
          ],
          scenarioKey: 'mission',
          target: { type: 'viewportCenter' },
          placement: 'center',
          showBackButton: false
        },
        {
          id: 'scenario-objectives',
          title: 'Mission Objectives',
          body: [
            'Each scenario has specific objectives to complete.',
            'Follow the instructions carefully to succeed.'
          ],
          scenarioKey: 'mission',
          target: { type: 'selector', value: '[data-tutorial="objectives"]' },
          placement: 'right',
          highlight: { pulse: true }
        },
        {
          id: 'scenario-hints',
          title: 'Hints Available',
          body: [
            'Stuck? Click the hint button for guidance.',
            'Note: Using hints may affect your final score.'
          ],
          scenarioKey: 'mission',
          target: { type: 'selector', value: '[data-tutorial="hints"]' },
          placement: 'bottom'
        },
        {
          id: 'scenario-progress',
          title: 'Track Progress',
          body: [
            'Your progress is saved automatically.',
            'You can pause and resume scenarios anytime.'
          ],
          scenarioKey: 'mission',
          target: { type: 'selector', value: '[data-tutorial="progress"]' },
          placement: 'left',
          nextButtonText: 'Start Training!'
        }
      ]
    }
  },

  // Default settings for all tutorials
  defaults: {
    blockingMode: 'semi',
    showCloseButton: true,
    highlightPadding: 8
  }
};

// Helper function to get tutorial by ID
export function getTutorialById(id) {
  if (id === 'globalIntro') {
    return tutorialConfig.globalIntro;
  }
  return tutorialConfig.scenarios[id];
}

// Helper function to get all available tutorials
export function getAllTutorials() {
  const tutorials = [tutorialConfig.globalIntro];
  Object.values(tutorialConfig.scenarios).forEach(scenario => {
    tutorials.push(scenario);
  });
  return tutorials;
}

// Helper to check if tutorial exists
export function tutorialExists(id) {
  return !!(getTutorialById(id));
}
