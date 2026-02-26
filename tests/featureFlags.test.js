const { parseFeatureFlagsEnv, flagNameToEnvVar, createFeatureFlags } = require('../featureFlags');

describe('featureFlags', () => {
  test('parseFeatureFlagsEnv supports JSON', () => {
    expect(parseFeatureFlagsEnv('{"a":true,"b":false}')).toEqual({ a: true, b: false });
  });

  test('parseFeatureFlagsEnv supports CSV and defaults to true when no value is provided', () => {
    expect(parseFeatureFlagsEnv('a,b=false, c=true')).toEqual({ a: true, b: false, c: true });
  });

  test('flagNameToEnvVar maps flag names to FF_ env vars', () => {
    expect(flagNameToEnvVar('new-checkout-flow')).toBe('FF_NEW_CHECKOUT_FLOW');
  });

  test('createFeatureFlags defaults to OFF when no env provided', () => {
    const ORIGINAL_ENV = process.env;
    process.env = { ...ORIGINAL_ENV };
    delete process.env.FEATURE_FLAGS;
    delete process.env.FF_NEW_CHECKOUT_FLOW;
    delete process.env.FEATURE_FLAG_PROVIDER;

    const ff = createFeatureFlags({ logger: { warn: () => {}, log: () => {} } });
    expect(ff.isEnabled('new-checkout-flow')).toBe(false);

    process.env = ORIGINAL_ENV;
  });
});


