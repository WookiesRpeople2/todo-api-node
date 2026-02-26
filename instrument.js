const Sentry = require("@sentry/node");
// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: "https://88ebab5cb168a4ea69b50cbbeb431ea6@o4510952784134144.ingest.de.sentry.io/4510952787673168",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});