/**
 * PM2 ecosystem file for running Razi Viewers in production.
 *
 * Usage:
 *   1. Build the app:    yarn build
 *   2. Start with PM2:   pm2 start ecosystem.config.cjs
 *   3. Save process list: pm2 save && pm2 startup  (optional, for reboot persistence)
 *
 * Other commands:
 *   pm2 status          - list processes
 *   pm2 logs            - view logs
 *   pm2 restart all     - restart the app
 *   pm2 stop all        - stop the app
 */
module.exports = {
  apps: [
    {
      name: 'razi-viewer',
      script: 'serve-dist.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      max_memory_restart: '1G',
      merge_logs: true,
      time: true,
    },
  ],
};
