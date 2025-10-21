// src/app/[language]/layout.tsx
// Run this whole segment on Edge and allow dynamic params at runtime.
export const runtime = 'edge';
export const preferredRegion = 'auto';

// Force server-rendering on demand (no static-only lock).
export const dynamic = 'force-dynamic';

// VERY IMPORTANT: allow params not returned by generateStaticParams.
export const dynamicParams = true;

// Keep this a Server Component (no "use client").
export default function LanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
