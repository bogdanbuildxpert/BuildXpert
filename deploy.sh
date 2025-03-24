#!/bin/bash

# Deployment script for BuildXpert on low-memory servers

echo "🚀 Starting BuildXpert deployment process..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Update from git if needed
# Uncomment the line below if you want to pull latest changes
# git pull

# Install dependencies if needed
# Uncomment if you need to install dependencies
# npm ci --production

# Clean up existing build artifacts
echo "🧹 Cleaning up previous build..."
rm -rf .next

# Set low memory environment variables
export NODE_OPTIONS="--max-old-space-size=1024"

# Run Prisma generate first, separately
echo "🔧 Generating Prisma client..."
npx prisma generate

# Force clean dependencies cache if needed
# rm -rf node_modules/.cache

# Run the build with reduced memory consumption
echo "🏗️ Building Next.js application with memory limits..."
cross-env NODE_OPTIONS="--max-old-space-size=1024" node scripts/debug-prisma-env.js && \
cross-env NODE_OPTIONS="--max-old-space-size=1024" next build

# Check if build was successful
if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found!"
  exit 1
fi

# Restart the application
echo "🔄 Restarting application with PM2..."
pm2 restart buildxpert

echo "✅ Deployment completed!" 