// src/app/[language]/layout.tsx
// Edge runtime required by Cloudflare next-on-pages
export const runtime = 'edge';
export const preferredRegion = 'auto'; // optional, let CF choose nearest

// IMPORTANT: This file must be a Server Component (no "use client").
export default function LanguageLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
