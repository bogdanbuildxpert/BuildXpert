# Database Connection in BuildXpert

BuildXpert uses Prisma as the sole ORM for all database operations. This document explains how database connections are managed in the application.

## Prisma Configuration

The application uses Prisma for all database interactions. The main configuration is set up in:

- `prisma/schema.prisma` - The Prisma schema defining data models
- `lib/prisma.ts` - The Prisma client instance and connection management

## Connection Management

### Production Environment

In production, the application uses:

- **Connection Pooling** - Configured for optimal performance in serverless environments
- **Real-time Functionality** - Implemented using Prisma middleware for change detection
- **Socket.IO Integration** - For real-time updates to clients

### Connection Variables

Important environment variables:

```
DATABASE_URL=postgresql://username:password@hostname:port/database?pgbouncer=true&connection_limit=5&pool_timeout=30&statement_cache_size=0&application_name=buildxpert
DIRECT_URL=postgresql://username:password@hostname:port/database
DATABASE_CONNECTION_LIMIT=5
DATABASE_POOL_TIMEOUT=30
```

- `DATABASE_URL` - Primary connection with PgBouncer parameters
- `DIRECT_URL` - Used by Prisma for migrations and schema changes
- `DATABASE_CONNECTION_LIMIT` - Maximum number of connections in the pool
- `DATABASE_POOL_TIMEOUT` - Timeout for idle connections

## Migration from Mixed Approach

This project previously used a mixed approach with:

1. Prisma ORM for most database operations
2. Direct PostgreSQL connections via the `pg` library for real-time features

As of the latest update, all database access has been consolidated through Prisma, eliminating the direct `pg` connections. This simplifies the codebase and provides these benefits:

- **Consistent data access patterns**
- **Type safety** across all database operations
- **Simplified maintenance**
- **Reduced connection overhead**
- **Centralized connection management**

## Real-time Features

Real-time features are now implemented using:

1. Prisma middleware to detect data changes
2. Socket.IO for pushing updates to connected clients
3. The Socket.IO server is initialized in the main server.js file

## Best Practices

When adding new database functionality:

1. **Always use Prisma models** - Never create direct database connections
2. **Use transactions** - For operations that involve multiple updates
3. **Implement middleware** - For cross-cutting concerns like logging or real-time updates
4. **Follow the repository pattern** - Group related database operations in service files
