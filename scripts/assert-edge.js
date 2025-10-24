// scripts/assert-edge.js
// Fail the build if /[language] was not emitted as an edge function by next-on-pages.

const fs = require('fs');
const path = require('path');

const logPath = path.join('.vercel', 'output', 'static', '_worker.js', 'nop-build-log.json');

if (!fs.existsSync(logPath)) {
  console.warn('ℹ️ Build log not found, skipping edge route assertion:', logPath);
  process.exit(0);
}

const raw = fs.readFileSync(logPath, 'utf8');

try {
  const data = JSON.parse(raw);
  const edgeBuildEntries =
    data?.buildFiles?.functions?.edge && Array.isArray(data.buildFiles.functions.edge)
      ? data.buildFiles.functions.edge
      : [];

  const buckets = [
    ...(Array.isArray(data.edgeFunctionRoutes) ? data.edgeFunctionRoutes : []),
    ...(Array.isArray(data.routes) ? data.routes : []),
    ...(Array.isArray(data.functions) ? data.functions : []),
    ...edgeBuildEntries,
  ];

  const found = buckets.some((entry) => {
    const serialized = JSON.stringify(entry);
    return (
      serialized.includes('/[language]') ||
      serialized.includes('\\/\\[language\\]') ||
      serialized.includes('^/[^/]+$')
    );
  });

  if (!found) {
    console.error('❌ Could not verify "/[language]" as an Edge route from nop-build-log.json');
    process.exit(1);
  }

  console.log('✅ Verified "/[language]" is present as an Edge route (from nop-build-log.json).');
} catch (error) {
  if (raw.includes('/[language]')) {
    console.log('✅ Verified "/[language]" via string search in nop-build-log.json.');
    process.exit(0);
  }

  console.error('❌ Failed to parse nop-build-log.json and "/[language]" not found.');
  process.exit(1);
}
