#!/bin/bash

# Simple deployment script for BuildXpert without requiring sudo

echo "🚀 Starting BuildXpert deployment process..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Clean up existing build artifacts
echo "🧹 Cleaning up previous build..."
rm -rf .next
rm -rf node_modules/.cache

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=1024"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
NODE_OPTIONS="--max-old-space-size=512" npx prisma generate

# Run Next.js build with limited memory and without running linters
echo "🏗️ Building Next.js application with memory limits..."
NODE_OPTIONS="--max-old-space-size=1024" NODE_ENV=production npx next build --no-lint

# Check if build was successful
if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found!"
  exit 1
fi

# Restart the application
echo "🔄 Restarting application with PM2..."
pm2 restart buildxpert

echo "✅ Deployment completed successfully!" 