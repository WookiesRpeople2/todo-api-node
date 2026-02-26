/**
 * Centralized logger configuration using Pino
 * Provides structured logging with environment-aware transports
 */
const pino = require('pino');

// Configure transport based on environment
const transport = process.env.NODE_ENV === 'production'
  ? undefined // Use stdout with JSON in production
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      env: process.env.NODE_ENV || 'development',
    },
  },
  process.env.NODE_ENV === 'production' ? undefined : transport
);

module.exports = logger;
