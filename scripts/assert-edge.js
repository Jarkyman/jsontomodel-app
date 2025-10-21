// scripts/assert-edge.js
// Fail the build if /[language] was not emitted as an edge function by next-on-pages.

const fs = require('fs');
const path = require('path');

const manifestPath = path.join('.vercel', 'output', 'functions', 'edge-functions', 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ Edge manifest not found at ${manifestPath}. Did next-on-pages run?`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// The manifest has an array of routes with "pattern" (regex-like). We need one mapping /[language].
const hasLanguageEdge = (manifest.routes || []).some((r) => {
  // Cloudflare/Next may compile the pattern – match loosely for "/[language]" or equivalent regex
  const p = String(r.pattern || '');
  return p.includes('/[language]') || p.includes('^/[^/]+/?$') || p.includes('\\/\\[language\\]');
});

if (!hasLanguageEdge) {
  console.error('❌ /[language] was not configured as an Edge Function.');
  console.error('   Make sure export const runtime = "edge" exists in src/app/[language]/layout.tsx (server component).');
  process.exit(1);
}

console.log('✅ Verified: /[language] is configured as an Edge Function.');
