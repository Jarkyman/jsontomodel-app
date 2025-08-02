"use client";

import React, { Suspense } from "react";

// This wrapper is necessary because useSearchParams() in the Analytics component
// requires a Suspense boundary to work correctly during server rendering.
export default function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
