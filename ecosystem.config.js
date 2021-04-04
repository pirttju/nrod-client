module.exports = {
  apps : [{
    name: 'nrod-client',
    script: 'nrod-client.js',
    restart_delay: 3000,
    watch: false,
    env: {
      'NODE_ENV': 'production'
    },
    env_dev: {
      'NODE_ENV': 'development'
    }
  }]
};
