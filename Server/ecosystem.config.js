// ============================================================
// PM2 Ecosystem Config — Kamali Gifts Backend
// ============================================================
//
// USAGE:
//   First time start  : pm2 start ecosystem.config.js --env production
//   Reload (no downtime): pm2 reload kamali-gifts-api
//   Stop              : pm2 stop kamali-gifts-api
//   Delete            : pm2 delete kamali-gifts-api
//   View logs         : pm2 logs kamali-gifts-api
//   Monitor           : pm2 monit
//   Auto-start on boot: pm2 startup  (run the command it shows)
//                       pm2 save
// ============================================================

module.exports = {
  apps: [
    {
      // ── App Identity ───────────────────────────────────────
      name: "kamali-gifts-api",
      script: "server.js",

      // ── Instance Settings ──────────────────────────────────
      instances: 1,          // Use 1 for now; change to "max" for multi-core
      exec_mode: "fork",     // Use "cluster" if instances > 1

      // ── Auto Restart Settings ──────────────────────────────
      watch: false,          // Don't watch files (production)
      autorestart: true,     // Auto restart on crash
      max_restarts: 10,      // Max crash-restart attempts
      min_uptime: "10s",     // Must be up 10s to count as stable
      restart_delay: 3000,   // Wait 3s between restarts (ms)

      // ── Memory Limit ───────────────────────────────────────
      max_memory_restart: "500M", // Restart if RAM exceeds 500MB

      // ── Logs ───────────────────────────────────────────────
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,

      // ── Environment: Production ────────────────────────────
      // All real env values are read from your .env file.
      // PM2 will load them automatically via dotenv in server.js.
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // ── Environment: Development ───────────────────────────
      // Run with: pm2 start ecosystem.config.js --env development
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
      },
    },
  ],
};
