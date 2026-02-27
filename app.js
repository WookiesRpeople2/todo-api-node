/**
 * Main Express application for Todo API
 * Provides RESTful endpoints for managing todos with SQLite backend
 */
const express = require("express");
const Sentry = require("@sentry/node");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const todoRouter = require("./routes/todo");
const logger = require("./logger.js");

const { createFeatureFlags } = require("./featureFlags");

/**
 * Initialize Sentry for error tracking and monitoring
 * Only initializes if SENTRY_DSN environment variable is set
 */
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({
        app: true,
        request: true,
        serverName: true,
      }),
    ],
  });
}

const app = express();

/**
 * Helper function to conditionally load routes only in non-production environments
 * Used to gate debug endpoints that should not be exposed in production
 * @param {Function} callback - Function to execute if not in production
 */
const productionLazyImport = (callback) => {
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      callback();
    })();
  }
};

const featureFlags = createFeatureFlags({ logger: console });

// Parse incoming JSON request bodies
app.use(express.json());

/**
 * Sentry request context middleware
 * Enriches Sentry scope with request details for better error tracking
 */
app.use((req, _res, next) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setTag("http.method", req.method);
    Sentry.setTag("http.url", req.url);
    Sentry.setContext("request", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
    });
  }
  next();
});

/**
 * Sentry request handler middleware
 * Captures request information for error tracking
 */
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

/**
 * Health check endpoint
 * Returns a welcome message to verify API is running
 */
app.get("/", (_req, res) => {
  logger.info({ path: "/" }, "Welcome endpoint accessed");
  res.json({ message: "Welcome to the Enhanced Express Todo App!" });
});

/**
 * Feature-gated endpoint example.
 * Always registered to keep app behavior deterministic; returns 404 when disabled.
 */
app.get("/feat", (_req, res) => {
  if (!featureFlags.isEnabled("new-checkout-flow")) {
    logger.info({ path: "/feat", message: "Feature disabled", info: featureFlags.isEnabled("new-checkout-flow") }, "Feature disabled");
    return res.status(404).json({ detail: "Feature disabled" });
  }
  return res.json({ message: "Feature-Flag" });
});

/* Health endpoint
 * Returns API health status and metadata
 */
app.get("/health", (_req, res) => {
  logger.debug({ path: "/health" }, "Health check endpoint accessed");
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
})

/**
 * Debug endpoint - only available in development/test environments
 * Exposes environment variables for debugging purposes
 * Automatically disabled when NODE_ENV=production
 */
productionLazyImport(() => {
  app.get("/debug", (_req, res) => {
    res.json({
      message: "Debug endpoint",
    });
  });
});

/**
 * Test error endpoint - only available in development/test environments
 * Throws an error to test Sentry integration
 * Automatically disabled when NODE_ENV=production
 * Usage: GET /test-error?message=custom%20error
 */
productionLazyImport(() => {
  app.get("/test-error", (req, _res) => {
    const errorMessage = req.query.message || "Test error from /test-error endpoint";
    
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(errorMessage, "warning");
    }
    
    logger.warn({ message: errorMessage }, "Test error triggered");
    return _res.status(400).json({ 
      error: "test_error",
      message: errorMessage,
      sentryEnabled: !!process.env.SENTRY_DSN
    });
  });
});

/**
 * Swagger UI documentation endpoint
 * Serves interactive API documentation and static assets at /docs
 * Assets are served from node_modules/swagger-ui-dist with proper MIME types
 */
const swaggerUiDistPath = path.join(__dirname, "node_modules", "swagger-ui-dist");
app.use("/docs", express.static(swaggerUiDistPath));
app.get("/docs", swaggerUi.setup(swaggerDocument, { swaggerUrl: "/swagger.json" }));
app.get("/swagger.json", (_req, res) => {
  res.json(swaggerDocument);
});

// Mount todo routes under /todos path
app.use("/todos", todoRouter);

/**
 * Sentry error handler middleware
 * Must be the last middleware added
 * Captures unhandled errors and sends them to Sentry
 */
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

/**
 * Start the Express server
 * Listens on the specified or configured PORT
 * Logs startup information for observability
 * @param {number} port - Port number to listen on (default: 3000)
 * @param {string} host - Host to bind to (default: undefined/localhost)
 * @returns {http.Server} The server instance
 */
const startServer = (port = process.env.PORT || 3000, host = undefined) => {
  const server = app.listen(port, host, () => {
    logger.info({ port, pid: process.pid }, "Server started and listening");
  });
  return server;
};

// Export app and startServer for testing and external use
module.exports = app;
module.exports.startServer = startServer;

/**
 * Initialize and start the server if this module is the main entry point
 * This function is exported for testing purposes
 * @param {boolean} isMain - Override main-module detection for tests
 * @returns {http.Server|null} The server instance if started, null otherwise
 */
const initializeServer = (isMain = require.main === module) => {
  if (isMain) {
    return startServer();
  }
  return null;
};

module.exports.initializeServer = initializeServer;

/**
 * Start server only when run directly (not when imported for testing)
 * Supports custom PORT via environment variable, defaults to 3000
 */
initializeServer();
