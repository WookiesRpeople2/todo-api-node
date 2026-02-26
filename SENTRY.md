# Sentry Integration Guide

## Overview

Sentry is an error tracking and monitoring platform that helps you identify, debug, and resolve issues in your application in real-time. This API integrates Sentry for tracking exceptions and monitoring application health.

## Getting Started

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io/)
2. Sign up for a free account
3. Create a new project
4. Select **Node.js** as your platform
5. Copy your DSN (Looks like: `https://xxxxxxxxxxxx@o123456.ingest.sentry.io/123456`)

### 2. Configure Your Environment

Add your Sentry DSN to your `.env` file:

```bash
# .env
SENTRY_DSN=https://xxxxxxxxxxxx@o123456.ingest.sentry.io/123456
NODE_ENV=production
```

### 3. Features Included

The integration includes:

- **Request Tracking**: Captures HTTP request metadata (URL, method, headers, etc.)
- **Error Tracking**: Automatically captures unhandled exceptions and error responses
- **Performance Monitoring**: Tracks transaction latency and traces
- **Environment Detection**: Automatically categorizes errors by environment (development/production)
- **Integration with Express**: Automatically instruments Express.js middleware

## How It Works

### Request Handler Middleware
```javascript
// Automatically added when SENTRY_DSN is set
app.use(Sentry.Handlers.requestHandler());
```
- Captures incoming request information
- Creates a Sentry Scope with request context

### Error Handler Middleware
```javascript
// Automatically added when SENTRY_DSN is set
app.use(Sentry.Handlers.errorHandler());
```
- Captures unhandled errors and exceptions
- Sends error details to Sentry
- Returns proper error responses to clients

## Configuration Options

The current configuration includes:

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Tracks 100% of transactions in development
  // Tracks 10% in production (configurable)
});
```

### Sample Rates

- **Development**: 100% tracing (captures all transactions)
- **Production**: 10% tracing (adjustable via `SENTRY_DSN` or environment variables)

## Usage Examples

### Automatic Error Capture

Errors are automatically captured by Sentry:

```javascript
// This error will be automatically captured by Sentry
app.get("/error", (req, res) => {
  throw new Error("This will be sent to Sentry");
});
```

### Manual Error Capture

For custom error handling:

```javascript
const Sentry = require("@sentry/node");

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  res.status(500).json({ error: "Something went wrong" });
}
```

### Adding Context

Add contextual information to errors:

```javascript
Sentry.captureMessage("User action completed", {
  level: "info",
  contexts: {
    user: { id: userId, email: userEmail }
  }
});
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SENTRY_DSN` | Your Sentry project DSN | No | - |
| `NODE_ENV` | Environment name | No | `development` |

## Monitoring in Dashboard

Once configured with a valid DSN:

1. **Issues Page**: View all captured errors and exceptions
2. **Transactions**: Monitor endpoint performance and latency
3. **Releases**: Track errors across different application versions
4. **Alerts**: Set up notifications for critical errors

## Local Development

For local development, you can:

- **Leave SENTRY_DSN empty**: No errors will be sent to Sentry
- **Set a DSN**: Errors will be captured (useful for testing error handling)

## Testing

Sentry is disabled by default in tests (no `SENTRY_DSN` configured). Tests run without Sentry integration to avoid external dependencies.

To enable Sentry in tests:
```bash
SENTRY_DSN=https://your-dsn@o.ingest.sentry.io/123456 npm test
```

## Common Issues

### ERROR: Sentry is not initialized

This is not an error. It means `SENTRY_DSN` is not set. Sentry is optional for development.

### Missing WORKER Handles

Jest shows open WORKER handles when using Pino logger transport. This is normal and doesn't affect application functionality.

## Further Reading

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Express Integration](https://docs.sentry.io/platforms/node/integrations/express/)
- [Performance Monitoring](https://docs.sentry.io/platforms/node/performance/)

## Security Considerations

- Never commit your `SENTRY_DSN` to version control
- Use `.env` file with `.env` in `.gitignore`
- Use different DSNs for development and production
- Mask sensitive data in error reports if needed

## Disabling Sentry

To disable Sentry monitoring:

1. Remove or comment out the `SENTRY_DSN` environment variable
2. The application will run normally without Sentry
3. No breaking changes to the application
