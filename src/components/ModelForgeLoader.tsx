"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ModelForgeClient = dynamic(() => import('@/components/ModelForgeClient'), {
  ssr: false,
  loading: () => (
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
  ),
});

export default function ModelForgeLoader() {
  return <ModelForgeClient />;
}
