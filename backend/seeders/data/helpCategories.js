/**
 * Help Center Categories Data
 * Organized categories for GroundCTRL help system
 */

const helpCategories = [
  {
    code: 'GETTING_STARTED',
    name: 'Getting Started',
    description: 'Essential guides for new GroundCTRL operators. Start your journey here.',
    icon: 'rocket',
    color: '#2563EB',
    orderIndex: 0,
    isActive: true,
  },
  {
    code: 'MISSIONS',
    name: 'Mission Guides',
    description: 'Step-by-step walkthroughs for each training scenario and mission.',
    icon: 'target',
    color: '#16A34A',
    orderIndex: 1,
    isActive: true,
  },
  {
    code: 'SATELLITE_OPERATIONS',
    name: 'Satellite Operations',
    description: 'Subsystems, commissioning, power, thermal, attitude, and orbital mechanics.',
    icon: 'satellite',
    color: '#F97316',
    orderIndex: 2,
    isActive: true,
  },
  {
    code: 'COMMUNICATIONS',
    name: 'Communications',
    description: 'Ground stations, beacons, downlinks, and communication windows.',
    icon: 'radio',
    color: '#0EA5E9',
    orderIndex: 3,
    isActive: true,
  },
  {
    code: 'TIME_CONTROL',
    name: 'Time Control System',
    description: 'Understanding time acceleration, simulation speeds, and mission pacing.',
    icon: 'clock',
    color: '#8B5CF6',
    orderIndex: 4,
    isActive: true,
  },
  {
    code: 'NOVA_AI',
    name: 'Nova AI Assistant',
    description: 'Using Nova as your AI mission guide and training companion.',
    icon: 'sparkles',
    color: '#A855F7',
    orderIndex: 5,
    isActive: true,
  },
  {
    code: 'ACCOUNT_SETTINGS',
    name: 'Account & Settings',
    description: 'Profile management, progress tracking, and system settings.',
    icon: 'settings',
    color: '#6B7280',
    orderIndex: 6,
    isActive: true,
  },
];

module.exports = helpCategories;
