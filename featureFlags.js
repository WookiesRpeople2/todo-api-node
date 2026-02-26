/**
 * Feature flag helper with safe defaults.
 *
 * Goals:
 * - No network calls unless explicitly enabled
 * - Deterministic behavior in CI (env-driven)
 * - Safe fallback: missing config => flags are OFF
 *
 * Supported configuration:
 * - FEATURE_FLAGS='{"flag-name":true,"other-flag":false}' (JSON)
 * - FEATURE_FLAGS='flag-a,flag-b,flag-c=false' (CSV)
 * - FF_<FLAG_NAME_IN_SCREAMING_SNAKE>=true/false (per-flag env)
 * - FEATURE_FLAG_PROVIDER=env|flagsmith (default: env)
 * - FLAGSMITH_KEY=... (only used when provider=flagsmith)
 */

function parseBoolean(value) {
  if (value === undefined || value === null) return undefined;
  const v = String(value).trim().toLowerCase();
  if (["1", "true", "t", "yes", "y", "on", "enabled", "enable"].includes(v)) return true;
  if (["0", "false", "f", "no", "n", "off", "disabled", "disable"].includes(v)) return false;
  return undefined;
}

function flagNameToEnvVar(flagName) {
  return (
    "FF_" +
    String(flagName)
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase()
  );
}

function parseFeatureFlagsEnv(raw) {
  const flags = {};
  if (!raw) return flags;

  const s = String(raw).trim();
  if (!s) return flags;

  // JSON: {"flag": true}
  if (s.startsWith("{")) {
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj === "object") {
        for (const [k, v] of Object.entries(obj)) {
          const b = typeof v === "boolean" ? v : parseBoolean(v);
          if (b !== undefined) flags[k] = b;
        }
      }
      return flags;
    } catch {
      // Fallthrough to CSV parsing.
    }
  }

  // CSV: flag-a,flag-b=true,flag-c=false
  for (const part of s.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const [name, rawVal] = token.split("=", 2).map((x) => x.trim());
    if (!name) continue;
    const b = rawVal === undefined ? true : parseBoolean(rawVal);
    if (b !== undefined) flags[name] = b;
  }

  return flags;
}

function createFeatureFlags(options = {}) {
  const logger = options.logger ?? console;
  const provider = String(process.env.FEATURE_FLAG_PROVIDER ?? "env").trim().toLowerCase();

  const envFlags = parseFeatureFlagsEnv(process.env.FEATURE_FLAGS);

  // Per-flag env vars override FEATURE_FLAGS blob.
  function envOverride(flagName) {
    const envVar = flagNameToEnvVar(flagName);
    return parseBoolean(process.env[envVar]);
  }

  // ENV provider is fully synchronous and deterministic.
  if (provider === "env") {
    return {
      provider,
      isEnabled(flagName) {
        const ovr = envOverride(flagName);
        if (ovr !== undefined) return ovr;
        return envFlags[flagName] === true;
      },
    };
  }

  if (provider !== "flagsmith") {
    logger.warn?.(
      `[featureFlags] Unknown FEATURE_FLAG_PROVIDER="${provider}", falling back to env-only flags.`
    );
    return {
      provider: "env",
      isEnabled(flagName) {
        const ovr = envOverride(flagName);
        if (ovr !== undefined) return ovr;
        return envFlags[flagName] === true;
      },
    };
  }

  const key = process.env.FLAGSMITH_KEY;
  if (!key) {
    logger.warn?.("[featureFlags] FEATURE_FLAG_PROVIDER=flagsmith but FLAGSMITH_KEY is missing; using env-only flags.");
    return {
      provider: "env",
      isEnabled(flagName) {
        const ovr = envOverride(flagName);
        if (ovr !== undefined) return ovr;
        return envFlags[flagName] === true;
      },
    };
  }

  // Flagsmith provider (optional). We *never* fail hard; we fall back to envFlags.
  const Flagsmith = require("flagsmith-nodejs");
  const flagsmith = new Flagsmith({ environmentKey: key });
  let ready = false;

  // Kick off initialization in the background so app startup can't break.
  // If this fails or times out, env flags still work.
  const timeoutMs = Number(process.env.FLAGSMITH_TIMEOUT_MS ?? options.timeoutMs ?? 1500);

  const initPromise = Promise.race([
    flagsmith.getEnvironmentFlags(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Flagsmith init timeout")), timeoutMs)),
  ])
    .then(() => {
      ready = true;
      logger.log?.("[featureFlags] Flagsmith flags loaded.");
    })
    .catch((err) => {
      ready = false;
      logger.warn?.(`[featureFlags] Flagsmith init failed (${err.message}); using env-only flags.`);
    });

  // Prevent unhandled rejections in edge cases.
  initPromise.catch(() => {});

  return {
    provider: "flagsmith",
    isEnabled(flagName) {
      const ovr = envOverride(flagName);
      if (ovr !== undefined) return ovr;
      if (ready) return Boolean(flagsmith.hasFeature(flagName));
      return envFlags[flagName] === true;
    },
  };
}

module.exports = {
  createFeatureFlags,
  // exported for unit tests / reuse
  parseFeatureFlagsEnv,
  flagNameToEnvVar,
};


