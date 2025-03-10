/**
 * This script helps migrate data from SQLite to PostgreSQL
 *
 * Usage:
 * 1. Make sure your .env file has the correct PostgreSQL connection string
 * 2. Run: npx ts-node scripts/migrate-to-postgres.ts
 */

import { PrismaClient as PrismaClientPostgres } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Create a backup of the SQLite database
function backupSqliteDatabase() {
  console.log("Creating backup of SQLite database...");
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const backupPath = path.join(
    process.cwd(),
    "prisma",
    `dev.db.backup-${Date.now()}`
  );

  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`SQLite database backed up to ${backupPath}`);
  } else {
    console.log("No SQLite database found to backup.");
  }
}

// Run Prisma migrations for PostgreSQL
async function runPrismaMigrations() {
  console.log("Running Prisma migrations for PostgreSQL...");
  try {
    // Reset the database to ensure a clean state
    execSync("npx prisma migrate reset --force", { stdio: "inherit" });

    // Generate Prisma client
    execSync("npx prisma generate", { stdio: "inherit" });

    console.log("Prisma migrations completed successfully.");
  } catch (error) {
    console.error("Error running Prisma migrations:", error);
    process.exit(1);
  }
}

// Seed the PostgreSQL database
async function seedPostgresDatabase() {
  console.log("Seeding PostgreSQL database...");
  try {
    execSync("npx prisma db seed", { stdio: "inherit" });
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Main migration function
async function migrateToPostgres() {
  console.log("Starting migration from SQLite to PostgreSQL...");

  // Backup SQLite database
  backupSqliteDatabase();

  // Run Prisma migrations
  await runPrismaMigrations();

  // Seed the database
  await seedPostgresDatabase();

  console.log("Migration completed successfully!");
  console.log("Your application is now using PostgreSQL.");
}

// Run the migration
migrateToPostgres().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
