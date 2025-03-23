@echo off
echo Preparing to start BuildXpert server...

echo Checking for environment variables...
if not exist .env (
  echo WARNING: .env file not found. Make sure you have set up your environment variables properly.
  echo Creating a basic .env file with required NextAuth settings...
  echo NEXTAUTH_URL=http://localhost:3000> .env
  echo NEXTAUTH_SECRET=development-secret-key>> .env
  echo NOTE: You should update the .env file with proper secret keys in production.
)

echo Building the application...
call npm run build

echo Starting BuildXpert server with PM2...
pm2 start ecosystem.config.js

echo.
echo Server started! Access at http://localhost:3000
echo.
echo To stop the server, run: pm2 delete buildxpert
echo To view logs, run: pm2 logs
echo To monitor server, run: pm2 monit 