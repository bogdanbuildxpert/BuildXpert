# Docker Database Setup Guide

This guide explains how to use Docker with the database credentials from your environment variables.

## Overview

The system is configured to:

1. Use database credentials directly from your environment variables in `.env` and `.env.production`
2. These same environment variables are also used in Vercel deployments
3. Docker uses these same environment variables for consistency

## Environment Variables

The following variables are required in your `.env` file:

```
# Main database connection string
DATABASE_URL=postgresql://username:password@hostname:port/database

# Docker database credentials (extracted from DATABASE_URL)
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_DB=database
POSTGRES_HOST=hostname
POSTGRES_PORT=port
```

## Setup Steps

### Running Docker with Environment Variables

```bash
# This command will:
# 1. Verify your Docker environment variables
# 2. Start Docker container with those credentials
npm run docker:start
```

### Manual Setup (if needed)

If you need to verify the Docker environment without starting the container:

```bash
# Verify Docker environment variables
npm run docker:verify
```

Then you can start Docker manually:

```bash
docker-compose up -d
```

## Vercel Deployment

When deploying to Vercel, these environment variables will be used from your Vercel project settings.
They are automatically included in your `vercel.json` file.

## Troubleshooting

- If you change your `DATABASE_URL` in `.env`, make sure to update the individual Docker variables as well
- If you get connection errors, make sure your Docker container is running: `docker ps`
- To reset the Docker database completely: `docker-compose down -v && npm run docker:start`
