// PostgreSQL notification functionality (DISABLED)
// This file is kept as a stub since the messaging system has been removed

// Create mock functions to prevent errors
function initSocketServer(server) {
  console.log("Socket.IO server initialization skipped - messaging disabled");
  return {
    on: () => {},
    emit: () => {},
  };
}

async function initPgNotify() {
  console.log("PostgreSQL notifications disabled - messaging system removed");
  return false;
}

async function setupPgNotifyTriggers() {
  console.log("PostgreSQL triggers setup skipped - messaging system removed");
  return;
}

async function closeConnections() {
  console.log("No connections to close - messaging system removed");
  return;
}

// Export mock functions
module.exports = {
  initSocketServer,
  initPgNotify,
  setupPgNotifyTriggers,
  closeConnections,
};
