// Hostinger VPS / cPanel / hPanel PM2 Ecosystem Configuration for Wadaage Mobility
module.exports = {
  apps: [
    {
      name: 'wadaage-mobility',
      script: './dist/server.cjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    }
  ]
};
