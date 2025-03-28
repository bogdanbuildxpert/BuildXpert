module.exports = {
  apps: [
    {
      name: "buildxpert",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1536M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NEXTAUTH_URL: "https://buildxpert.ie",
        NEXTAUTH_SECRET:
          process.env.NEXTAUTH_SECRET || "your-development-secret-key",
        NODE_OPTIONS: "--max-old-space-size=1536",
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
