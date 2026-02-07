module.exports = {
  ci: {
    collect: {
      staticDistDir: './frontend/dist',
      numberOfRuns: 3,
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'color-contrast': 'off',
        'errors-in-console': 'off',
        'network-dependency-tree-insight': 'off',
        'unused-javascript': 'off',
        'uses-rel-preconnect': 'off',
        'cache-insight': 'off', // Will be handled by hosting
        'uses-long-cache-ttl': 'off', // Will be handled by hosting
        'render-blocking-insight': 'off',
        'render-blocking-resources': 'off',
        'font-size': 'off',
        'forced-reflow-insight': 'off',
        'meta-description': 'off',
        'unminified-javascript': 'off',
        'valid-source-maps': 'off',
        'max-potential-fid': 'off',
      },
    },
  },
};