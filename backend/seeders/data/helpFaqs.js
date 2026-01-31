/**
 * Help Center FAQs Data
 * Frequently asked questions organized by category
 */

const helpFaqs = [
  // ===== GETTING STARTED =====
  {
    categoryCode: 'GETTING_STARTED',
    question: 'How do I start my first mission?',
    answer: 'Go to the Missions page from your dashboard, select "First Contact: Satellite Commissioning" (the first Rookie Pilot mission), read the briefing, then click "Begin Mission". You can also click "Skip Briefing" to go straight to the simulator.',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'GETTING_STARTED',
    question: 'Do I need any prior knowledge to use GroundCTRL?',
    answer: 'No prior knowledge required! GroundCTRL is designed to teach you satellite operations from scratch. Start with the Rookie Pilot missions and progress at your own pace. Nova AI is available anytime to answer questions.',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'GETTING_STARTED',
    question: 'Is my progress automatically saved?',
    answer: 'Yes! GroundCTRL automatically saves your progress continuously. You can close your browser and resume any mission exactly where you left off.',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'GETTING_STARTED',
    question: 'Can I restart a mission if I make a mistake?',
    answer: 'Absolutely! You can abandon and restart any mission from the mission briefing page. Your best score will be kept, so feel free to practice and improve.',
    orderIndex: 3,
    isActive: true,
  },

  // ===== MISSIONS =====
  {
    categoryCode: 'MISSIONS',
    question: 'What are Mission Points (MP) and how do I earn them?',
    answer: 'Mission Points (MP) track your progress as a satellite operator. Earn MP by completing missions successfully. Bonus MP is awarded for completing objectives quickly, using fewer hints, and maintaining perfect satellite health.',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'MISSIONS',
    question: 'What do the difficulty levels mean?',
    answer: 'Beginner (1-2 stars): Basic operations, lots of guidance. Intermediate (3 stars): More complex systems, less hand-holding. Advanced (4-5 stars): Complete missions requiring mastery of all skills.',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'MISSIONS',
    question: 'Why can\'t I access certain missions?',
    answer: 'Some missions have prerequisites - you must complete earlier missions first. This ensures you have the skills needed. Check the mission briefing to see which missions must be completed first.',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'MISSIONS',
    question: 'How long does each mission take?',
    answer: 'Mission durations vary from 15-60 minutes of simulation time. Using time acceleration, real-world time is usually much shorter. Sandbox missions can be as long as you want!',
    orderIndex: 3,
    isActive: true,
  },
  {
    categoryCode: 'MISSIONS',
    question: 'Can I complete missions in any order?',
    answer: 'Mostly yes, but some advanced missions require completing specific prerequisites first. The mission briefing always shows what\'s required. We recommend following the suggested order for best learning.',
    orderIndex: 4,
    isActive: true,
  },
  {
    categoryCode: 'MISSIONS',
    question: 'What happens if I fail a mission?',
    answer: 'Failure is part of learning! You can restart any mission as many times as needed. Review what went wrong, ask Nova for guidance, and try different strategies. Your best score is always kept.',
    orderIndex: 5,
    isActive: true,
  },

  // ===== SATELLITE OPERATIONS =====
  {
    categoryCode: 'SATELLITE_OPERATIONS',
    question: 'What is satellite commissioning?',
    answer: 'Commissioning is the critical phase after launch where you verify all satellite systems are working, deploy antennas and solar panels, and configure the satellite for its mission. It\'s always the first step!',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'SATELLITE_OPERATIONS',
    question: 'Why is my battery draining so fast?',
    answer: 'Common causes: (1) You\'re in eclipse (Earth\'s shadow) - solar panels can\'t charge, (2) Too many subsystems active simultaneously, (3) Running payload during high-power operations like maneuvers. Check your power budget!',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'SATELLITE_OPERATIONS',
    question: 'What happens if my battery reaches 0%?',
    answer: 'Mission failure! Satellites enter safe mode when power drops below 10%. Below 0% means complete power loss - the satellite is unrecoverable. Always monitor battery levels and plan for eclipse periods.',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'SATELLITE_OPERATIONS',
    question: 'How do I know which subsystems to turn on/off?',
    answer: 'Use STATUS commands to check satellite health. Generally: Keep core systems (power, ADCS, comms) always on. Turn payload on only when needed. Activate thermal systems in extreme temperatures. Nova can provide specific guidance!',
    orderIndex: 3,
    isActive: true,
  },
  {
    categoryCode: 'SATELLITE_OPERATIONS',
    question: 'What\'s the difference between attitude and orbit?',
    answer: 'Orbit = satellite\'s path around Earth (altitude, inclination, speed). Attitude = which way the satellite is pointing (orientation). You need good attitude control to point solar panels at sun or payload at Earth!',
    orderIndex: 4,
    isActive: true,
  },
  {
    categoryCode: 'SATELLITE_OPERATIONS',
    question: 'Why did my satellite go into safe mode?',
    answer: 'Safe mode is an automatic protection when critical issues detected: low battery (<10%), high temperature, attitude error, or communication loss. Safe mode minimizes power use and stabilizes the satellite so you can fix the problem.',
    orderIndex: 5,
    isActive: true,
  },

  // ===== COMMUNICATIONS =====
  {
    categoryCode: 'COMMUNICATIONS',
    question: 'Why can\'t I contact my satellite right now?',
    answer: 'Your satellite needs line-of-sight to a ground station. If no stations are visible (satellite is over ocean or opposite side of Earth), you must wait for the next pass. Use time acceleration to find the next window faster!',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'COMMUNICATIONS',
    question: 'What are beacon signals?',
    answer: 'Beacons are simple periodic transmissions (every 30-60 seconds) that confirm satellite health. They include battery voltage, temperature, and basic status. Beacons work even with minimal power!',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'COMMUNICATIONS',
    question: 'When should I schedule a downlink?',
    answer: 'Schedule downlinks during high-elevation ground station passes (>30° elevation preferred). Ensure battery is >40% charged. Downlinks use extra power and take several minutes to complete.',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'COMMUNICATIONS',
    question: 'Which ground stations are available?',
    answer: 'GroundCTRL simulates 7 real ground stations worldwide: NASA Wallops (USA), ESA Kiruna (Sweden), JAXA Tanegashima (Japan), CSA Prince Albert (Canada), ISRO Bangalore (India), KARI Daejeon (South Korea), and UKSA Goonhilly (UK).',
    orderIndex: 3,
    isActive: true,
  },
  {
    categoryCode: 'COMMUNICATIONS',
    question: 'Why did my downlink fail?',
    answer: 'Common reasons: (1) Lost line-of-sight (pass ended), (2) Battery too low, (3) Antenna not deployed, (4) Attitude error (not pointing at ground station). Always verify communication link before starting downlink!',
    orderIndex: 4,
    isActive: true,
  },

  // ===== TIME CONTROL =====
  {
    categoryCode: 'TIME_CONTROL',
    question: 'How does time acceleration work?',
    answer: 'Time acceleration lets you experience hours of orbital time in minutes. Physics and orbital mechanics run at accelerated rates. Choose from 1x (real-time) to 1000x (sandbox only) depending on the operation.',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'TIME_CONTROL',
    question: 'When should I use real-time vs. acceleration?',
    answer: 'Real-time (1x): Commissioning, maneuvers, emergencies, critical operations. 10x-30x: Observing orbits, routine monitoring. 60x-100x: Finding next ground station pass, long missions. Choose based on what you\'re doing!',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'TIME_CONTROL',
    question: 'Does time acceleration affect my score?',
    answer: 'No! Mission Points are based on simulation time, not real-world time. Using appropriate acceleration demonstrates operator skill. Complete missions efficiently in sim-time for bonus MP!',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'TIME_CONTROL',
    question: 'What is auto-acceleration?',
    answer: 'Some missions automatically adjust time scale based on activity. It speeds up during quiet periods and slows for critical events. You can override it anytime by manually changing time scale.',
    orderIndex: 3,
    isActive: true,
  },
  {
    categoryCode: 'TIME_CONTROL',
    question: 'Can I pause the simulation?',
    answer: 'Yes! Set time scale to 0x (pause) or 1x (real-time) anytime. Your progress is continuously saved, so you can even close your browser and resume later.',
    orderIndex: 4,
    isActive: true,
  },

  // ===== NOVA AI =====
  {
    categoryCode: 'NOVA_AI',
    question: 'What is Nova AI?',
    answer: 'Nova is your AI training assistant powered by advanced language models. Ask questions about satellite systems, get hints when stuck, and receive explanations of concepts. Nova is designed to guide you, not give direct answers!',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'NOVA_AI',
    question: 'Does using Nova affect my score?',
    answer: 'Using hints reduces your MP bonus, but asking questions doesn\'t! Feel free to ask Nova to explain concepts, clarify objectives, or troubleshoot issues. Learning is more important than score!',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'NOVA_AI',
    question: 'What kinds of questions can I ask Nova?',
    answer: 'Anything about satellite operations! "Why is my battery draining?", "How do I deploy the antenna?", "What\'s the next ground station pass?", "Explain orbital mechanics", "What should I do next?". Be specific for best results!',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'NOVA_AI',
    question: 'Why won\'t Nova just tell me the answer?',
    answer: 'Nova is a teaching assistant, not a cheat sheet! You learn best by solving problems yourself. Nova provides progressive hints - starting general and becoming more specific. This approach builds real understanding!',
    orderIndex: 3,
    isActive: true,
  },
  {
    categoryCode: 'NOVA_AI',
    question: 'Can Nova make mistakes?',
    answer: 'While Nova is highly advanced, it\'s still AI and can occasionally be incorrect. Use Nova as a guide, but verify important decisions yourself. If you think Nova is wrong, that\'s a great learning opportunity!',
    orderIndex: 4,
    isActive: true,
  },

  // ===== ACCOUNT & SETTINGS =====
  {
    categoryCode: 'ACCOUNT_SETTINGS',
    question: 'How do I change my password?',
    answer: 'Go to Settings → Account → Security. Click "Change Password", enter your current password, then create a new one. You\'ll receive a confirmation email.',
    orderIndex: 0,
    isActive: true,
  },
  {
    categoryCode: 'ACCOUNT_SETTINGS',
    question: 'Where can I see my progress statistics?',
    answer: 'Your Dashboard shows key stats (MP earned, missions completed). For detailed statistics, go to Account → Progress. You\'ll see completion rates, average scores, time efficiency, and more!',
    orderIndex: 1,
    isActive: true,
  },
  {
    categoryCode: 'ACCOUNT_SETTINGS',
    question: 'Can I delete my account?',
    answer: 'Yes, but this action is permanent! Go to Settings → Account → Security → Delete Account. You\'ll be asked to confirm. All your progress, missions, and data will be permanently removed.',
    orderIndex: 2,
    isActive: true,
  },
  {
    categoryCode: 'ACCOUNT_SETTINGS',
    question: 'What are the different operator tiers?',
    answer: 'Rookie Pilot (0-100 MP): Basic operations. Mission Specialist (100-300 MP): Advanced systems. Mission Commander (300+ MP): Complete mission autonomy. Your tier unlocks new missions and badges!',
    orderIndex: 3,
    isActive: true,
  },
  {
    categoryCode: 'ACCOUNT_SETTINGS',
    question: 'How do I turn off notifications?',
    answer: 'Go to Settings → Notifications. Toggle email notifications on/off by category: Mission completions, New missions unlocked, Tier promotions, System updates. Choose what matters to you!',
    orderIndex: 4,
    isActive: true,
  },
];

module.exports = helpFaqs;
