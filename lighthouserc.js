module.exports = {
  ci: {
    collect: {
      staticDistDir: './frontend/dist',
      numberOfRuns: 3,
      settings: {
        skipAudits: ['errors-in-console'],
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'total-blocking-time',
          'cumulative-layout-shift',
          'speed-index'
        ]
      }
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { 'minScore': 0.4 }],
        'largest-contentful-paint': ['error', { 'minScore': 0.1 }],
        'total-blocking-time': ['error', { 'minScore': 0.5 }],
        'cumulative-layout-shift': ['error', { 'minScore': 0.5 }],
        'speed-index': ['error', { 'minScore': 0.5 }],
      },
    },
  },
};