const app = require("./app");
const config = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { archiveExpiredEvents } = require("./services/archiveService");

let server;
let archiveIntervalHandle;

// Runs the auto-archive sweep: any PUBLISHED/UPCOMING event whose
// date + endTime has passed gets flipped to ARCHIVED.
async function runArchiveSweep() {
  try {
    const { archivedCount } = await archiveExpiredEvents();
    if (archivedCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`[archive] Auto-archived ${archivedCount} event(s)`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[archive] Sweep failed:", err);
  }
}

async function start() {
  try {
    await connectDatabase();
    server = app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(
        `[server] EventVerse backend listening on port ${config.port} (${config.nodeEnv})`,
      );
    });

    // Run once at startup, then on a recurring timer, so events don't wait
    // for the next request to be archived.
    await runArchiveSweep();
    archiveIntervalHandle = setInterval(
      runArchiveSweep,
      config.archiveSweepIntervalMs,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`[server] Received ${signal}, shutting down gracefully...`);
  if (archiveIntervalHandle) clearInterval(archiveIntervalHandle);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("[server] Unhandled rejection:", reason);
});

start();
