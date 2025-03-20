// Script to verify Docker database credentials from environment variables
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config();

// Function to validate Docker environment variables
function validateDockerEnv() {
  const requiredVars = [
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      `Missing required Docker environment variables: ${missing.join(", ")}`
    );

    // If DATABASE_URL exists, try to extract credentials
    if (process.env.DATABASE_URL) {
      console.log(
        "Attempting to extract Docker credentials from DATABASE_URL..."
      );
      const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
      const match = process.env.DATABASE_URL.match(regex);

      if (match) {
        process.env.POSTGRES_USER = match[1];
        process.env.POSTGRES_PASSWORD = match[2];
        process.env.POSTGRES_HOST = match[3];
        process.env.POSTGRES_PORT = match[4];
        process.env.POSTGRES_DB = match[5];

        console.log(
          "Successfully extracted Docker credentials from DATABASE_URL"
        );
        return true;
      } else {
        console.error("Could not parse DATABASE_URL");
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}

// Main execution
if (!validateDockerEnv()) {
  console.error("Docker environment variables are not properly set");
  process.exit(1);
}

console.log("Docker environment variables are properly set:");
console.log(`Database: ${process.env.POSTGRES_DB}`);
console.log(`User: ${process.env.POSTGRES_USER}`);
console.log("Password: [HIDDEN]");
console.log(`Host: ${process.env.POSTGRES_HOST}`);
console.log(`Port: ${process.env.POSTGRES_PORT}`);
