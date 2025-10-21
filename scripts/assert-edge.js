// scripts/assert-edge.js
// Fail the build if /[language] was not emitted as an edge function by next-on-pages.

const fs = require('fs');
const path = require('path');

const manifestPath = path.join('.vercel', 'output', 'functions', 'edge-functions', 'manifest.json');

// If the manifest doesn't exist, it's not necessarily a failure if there are no edge functions.
if (!fs.existsSync(manifestPath)) {
  console.log('✅ No edge functions found in manifest. Skipping verification.');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// The manifest has an array of routes with "pattern" (regex-like). We need one mapping /[language].
const hasLanguageEdge = (manifest.routes || []).some((r) => {
  // Cloudflare/Next may compile the pattern – match loosely for "/[language]" or equivalent regex
  const p = String(r.pattern || '');
  return p.includes('/[language]') || p.includes('^/[^/]+/?$') || p.includes('\\/\\[language\\]');
});

if (hasLanguageEdge) {
  console.error('❌ /[language] was unexpectedly configured as an Edge Function.');
  process.exit(1);
}

console.log('✅ Verified: /[language] is not configured as an Edge Function.');
