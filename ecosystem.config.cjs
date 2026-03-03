/**
 * PM2 ecosystem file for running Razi Viewers in production.
 *
 * Deploy steps (after git pull):
 *   1. From repo root:  cd /path/to/Razi-Viewers
 *   2. Install deps:   yarn install
 *   3. Clean + build:   yarn build:production   (or yarn build:production:lowmem on small VMs)
 *      - If build finishes in ~1 second, you are in the wrong directory or cache is stale.
 *      - Run: rm -rf platform/app/dist node_modules/.cache && yarn build
 *   4. Restart app:     pm2 restart razi-viewer
 *   5. Verify:          ls -la platform/app/dist  (files should have current timestamp)
 *
 * Other commands:
 *   pm2 status          - list processes
 *   pm2 logs            - view logs
 *   pm2 restart all      - restart the app
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
