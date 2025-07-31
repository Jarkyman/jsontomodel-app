"use client";

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ModelForgeClient from '@/components/ModelForgeClient';

const LoadingSkeleton = () => (
  <div className="w-full max-w-7xl space-y-8">
    <div className="text-center">
      <Skeleton className="mx-auto h-12 w-64" />
      <Skeleton className="mx-auto mt-4 h-6 w-96" />
    </div>
    <div className="mx-auto flex w-full max-w-sm items-center gap-4">
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  </div>
);

export default function ModelForgeLoader() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingSkeleton />;
  }

  return <ModelForgeClient />;
}
