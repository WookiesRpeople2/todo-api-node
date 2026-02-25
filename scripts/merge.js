const fs = require('fs');
const path = require('path');

const shardsDir = path.resolve(process.env.SHARDS_DIR ?? 'coverage-shards');
const outDir = path.resolve(process.env.OUT_DIR ?? 'coverage');
const mode = process.env.MERGE_MODE ?? 'json';

fs.mkdirSync(outDir, { recursive: true });

const shardDirs = fs.readdirSync(shardsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join(shardsDir, d.name));

if (mode === 'lcov') {
  const chunks = [];

  for (const dir of shardDirs) {
    const file = path.join(dir, 'lcov.info');
    if (!fs.existsSync(file)) {
      console.warn(`No lcov.info in ${dir}, skipping`);
      continue;
    }
    chunks.push(fs.readFileSync(file, 'utf8').trimEnd());
  }

  fs.writeFileSync(path.join(outDir, 'lcov.info'), chunks.join('\n') + '\n');
  console.log(`Merged ${chunks.length} shards → ${outDir}/lcov.info`);

} else {
  const merged = {};

  for (const dir of shardDirs) {
    const file = path.join(dir, 'coverage-final.json');
    if (!fs.existsSync(file)) {
      console.warn(`No coverage-final.json in ${dir}, skipping`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [filePath, fileCoverage] of Object.entries(data)) {
      if (!merged[filePath]) {
        merged[filePath] = structuredClone(fileCoverage);
        continue;
      }
      const m = merged[filePath];
      for (const key of Object.keys(fileCoverage.s)) {
        m.s[key] = (m.s[key] ?? 0) + (fileCoverage.s[key] ?? 0);
      }
      for (const key of Object.keys(fileCoverage.f)) {
        m.f[key] = (m.f[key] ?? 0) + (fileCoverage.f[key] ?? 0);
      }
      for (const key of Object.keys(fileCoverage.b)) {
        if (!m.b[key]) {
          m.b[key] = [...fileCoverage.b[key]];
        } else {
          m.b[key] = m.b[key].map((count, i) => count + (fileCoverage.b[key][i] ?? 0));
        }
      }
    }
  }

  fs.writeFileSync(
    path.join(outDir, 'coverage-final.json'),
    JSON.stringify(merged, null, 2)
  );
  console.log(`Merged ${shardDirs.length} shards → ${outDir}/coverage-final.json`);
}
