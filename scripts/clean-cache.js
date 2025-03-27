/**
 * Clean Cache Script
 *
 * This script cleans various caches used by the Next.js build process:
 * - Removes the .next directory (build output)
 * - Optionally clears the npm cache
 *
 * Usage:
 *   npm run clean
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const nextDir = path.join(rootDir, ".next");
const nextCacheDir = path.join(rootDir, ".next-cache");

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

console.log(`${colors.cyan}🧹 Starting cache cleanup...${colors.reset}\n`);

// Check and delete .next directory
if (fs.existsSync(nextDir)) {
  try {
    console.log(
      `${colors.yellow}Removing Next.js build directory (.next)...${colors.reset}`
    );

    // Use different commands based on platform
    if (process.platform === "win32") {
      execSync(`rmdir /s /q "${nextDir}"`, { stdio: "inherit" });
    } else {
      execSync(`rm -rf "${nextDir}"`, { stdio: "inherit" });
    }

    console.log(
      `${colors.green}✓ Successfully removed .next directory${colors.reset}`
    );
  } catch (error) {
    console.error(
      `${colors.red}Error removing .next directory: ${error.message}${colors.reset}`
    );
  }
} else {
  console.log(
    `${colors.yellow}No .next directory found. Skipping...${colors.reset}`
  );
}

// Check and delete .next-cache directory if it exists
if (fs.existsSync(nextCacheDir)) {
  try {
    console.log(
      `${colors.yellow}Removing Next.js cache directory (.next-cache)...${colors.reset}`
    );

    if (process.platform === "win32") {
      execSync(`rmdir /s /q "${nextCacheDir}"`, { stdio: "inherit" });
    } else {
      execSync(`rm -rf "${nextCacheDir}"`, { stdio: "inherit" });
    }

    console.log(
      `${colors.green}✓ Successfully removed .next-cache directory${colors.reset}`
    );
  } catch (error) {
    console.error(
      `${colors.red}Error removing .next-cache directory: ${error.message}${colors.reset}`
    );
  }
} else {
  console.log(
    `${colors.yellow}No .next-cache directory found. Skipping...${colors.reset}`
  );
}

// Clear npm cache if requested
const clearNpmCache = process.argv.includes("--clear-npm-cache");
if (clearNpmCache) {
  try {
    console.log(`${colors.yellow}Cleaning npm cache...${colors.reset}`);
    execSync("npm cache clean --force", { stdio: "inherit" });
    console.log(
      `${colors.green}✓ Successfully cleaned npm cache${colors.reset}`
    );
  } catch (error) {
    console.error(
      `${colors.red}Error cleaning npm cache: ${error.message}${colors.reset}`
    );
  }
}

console.log(
  `\n${colors.green}🎉 Cache cleanup completed successfully!${colors.reset}`
);
console.log(
  `${colors.cyan}You can now rebuild your application with: npm run build${colors.reset}`
);
