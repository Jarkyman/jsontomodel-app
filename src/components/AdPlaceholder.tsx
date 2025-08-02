"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

interface AdPlaceholderProps {
  className?: string;
  adClient: string;
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
}

export default function AdPlaceholder({
  className,
  adClient,
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true
}: AdPlaceholderProps) {
  const hasPushedAd = useRef(false);

  useEffect(() => {
    if (hasPushedAd.current) {
      return;
    }

    try {
      setTimeout(() => {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        hasPushedAd.current = true;
      }, 50); // Small delay to ensure container has dimensions
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [adClient, adSlot]);

  return (
    <div className={cn('h-24', className)}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      ></ins>
    </div>
  );
}
