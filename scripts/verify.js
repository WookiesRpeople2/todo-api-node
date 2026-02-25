const fs = require("fs");
const path = require("path");
const config = require("../jest.config.js");

const file = path.resolve(process.cwd(), process.env.DIR);

if (!fs.existsSync(file)) {
  console.error('Coverage file not found');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(file, 'utf8'));
const thresholds = config.coverageThreshold.global;

const count = obj =>
  Object.values(obj)
    .flatMap(v => (Array.isArray(v) ? v : [v]))
    .reduce(
      (acc, n) => ({
        total: acc.total + 1,
        covered: acc.covered + (n > 0 ? 1 : 0),
      }),
      { total: 0, covered: 0 }
    );

const pct = ({ covered, total }) =>
  total === 0 ? 100 : (covered / total) * 100;

const totals = Object.values(coverage).reduce(
  (acc, { s, f, b }) => ({
    statements: {
      total: acc.statements.total + count(s).total,
      covered: acc.statements.covered + count(s).covered,
    },
    functions: {
      total: acc.functions.total + count(f).total,
      covered: acc.functions.covered + count(f).covered,
    },
    branches: {
      total: acc.branches.total + count(b).total,
      covered: acc.branches.covered + count(b).covered,
    },
  }),
  {
    statements: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
  }
);

const METRICS = [
  { key: 'statements', data: totals.statements },
  { key: 'functions', data: totals.functions },
  { key: 'branches', data: totals.branches },
  { key: 'lines', data: totals.statements },
];

const results = METRICS
  .filter(({ key }) => thresholds[key] !== undefined)
  .map(({ key, data }) => {
    const value = pct(data);
    const min = thresholds[key];
    const pass = value >= min;

    console.log(
      `${key.padEnd(12)} ${value.toFixed(2).padStart(6)}%` +
      `  (required: ${String(min).padStart(3)}%)` +
      `  ${pass ? '✓' : '✗'}`
    );

    return pass;
  });

if (results.some(pass => !pass)) {
  console.error('\n✗ Coverage validation failed.');
  process.exit(1);
}

console.log('\n✓ Coverage validation passed.');

