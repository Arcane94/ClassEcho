// Template environment file showing the backend configuration variables expected at runtime.
const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
};

const sharedDatabase = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  port: parseNumber(process.env.DB_PORT, 3306),
};

const config = {
  observationDatabase: {
    ...sharedDatabase,
    db: process.env.OBSERVATION_DB_NAME || "observer",
  },
  visualizationDatabase: {
    ...sharedDatabase,
    db: process.env.VISUALIZATION_DB_NAME || "snapclass",
    userTable: process.env.VISUALIZATION_DB_USER_TABLE || "user",
    traceTable: process.env.VISUALIZATION_DB_TRACE_TABLE || "trace",
    emojiTable: process.env.VISUALIZATION_DB_EMOJI_TABLE || "emoji_reaction",
  },
  server: {
    port: parseNumber(process.env.SERVER_PORT || process.env.PORT, 3011),
  },
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "",
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: process.env.EMAIL_USER || "",
    appPassword: process.env.EMAIL_APP_PASSWORD || "",
    from: process.env.EMAIL_FROM || "",
  },
};

module.exports = config;
