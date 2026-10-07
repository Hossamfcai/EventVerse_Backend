require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Warning: environment variable ${key} is not set.`);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  mapbox: {
    // Public token used by the frontend; backend only validates coordinate shape.
    accessToken: process.env.MAPBOX_ACCESS_TOKEN,
  },
  storage: {
    url: process.env.STORAGE_URL,
    key: process.env.STORAGE_KEY,
    secret: process.env.STORAGE_SECRET,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  },
  archiveSweepIntervalMs:
    parseInt(process.env.ARCHIVE_SWEEP_INTERVAL_MS, 10) || 60 * 1000,
};
