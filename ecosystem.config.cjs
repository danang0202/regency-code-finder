module.exports = {
  apps: [
    {
      name: 'regency-code-finder',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3030
      },
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/err.log',
      time: true
    }
  ]
};
