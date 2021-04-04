module.exports = {
  apps : [{
    name: 'nrod-client',
    script: 'nrod-client.js',
    restart_delay: 1000,
    watch: true,
    env: {
      'NODE_ENV': 'production'
    },
    env_dev: {
      'NODE_ENV': 'development'
    }
  }]
};
