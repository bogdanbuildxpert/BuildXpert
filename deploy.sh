#!/bin/bash

# Deployment script for BuildXpert on low-memory servers

echo "🚀 Starting BuildXpert deployment process..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Create temporary swap file for build process
echo "💾 Creating temporary swap space for build process..."
if [ ! -f /swapfile_temp ]; then
  sudo fallocate -l 2G /swapfile_temp
  sudo chmod 600 /swapfile_temp
  sudo mkswap /swapfile_temp
  sudo swapon /swapfile_temp
  echo "✅ Temporary 2GB swap file created"
else
  echo "✅ Temporary swap file already exists"
  sudo swapon /swapfile_temp
fi

# Clean up existing build artifacts
echo "🧹 Cleaning up previous build..."
rm -rf .next
# Clean node_modules cache to prevent issues
rm -rf node_modules/.cache

# Make sure we have latest dependencies
echo "📦 Checking dependencies..."
npm ci --no-audit --prefer-offline

# Set aggressive memory limits for Node.js
export NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64 --optimize-for-size"

# Run Prisma generate first, separately
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run the build with reduced memory consumption, one step at a time
echo "🏗️ Building Next.js application with memory limits..."
node scripts/debug-prisma-env.js
if [ $? -ne 0 ]; then
  echo "❌ Prisma environment check failed!"
  sudo swapoff /swapfile_temp
  exit 1
fi

# Run actual build with memory optimizations
NODE_ENV=production next build --no-lint

# Check if build was successful
if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found!"
  sudo swapoff /swapfile_temp
  exit 1
fi

# Restart the application with PM2
echo "🔄 Restarting application with PM2..."
pm2 restart buildxpert

# Remove temporary swap file
echo "🧹 Removing temporary swap space..."
sudo swapoff /swapfile_temp
sudo rm -f /swapfile_temp

echo "✅ Deployment completed successfully!" 