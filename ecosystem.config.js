module.exports = {
  apps: [
    {
      name: "buildxpert",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXTAUTH_URL: "http://localhost:3000",
        NEXTAUTH_SECRET:
          process.env.NEXTAUTH_SECRET || "your-development-secret-key", // Always use a real secret in production
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      exec_mode: "fork",
    },
  ],
};
