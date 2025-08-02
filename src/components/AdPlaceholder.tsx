
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
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && adRef.current.firstChild) {
      const insElement = adRef.current.firstChild as HTMLElement;
      // If the 'ins' element already has a 'data-ad-status' attribute,
      // it means AdSense has already processed this slot.
      // This is the most reliable way to prevent the "already have ads" error in Strict Mode.
      if (insElement.getAttribute('data-ad-status')) {
        return;
      }
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [adClient, adSlot]);

  return (
    <div ref={adRef} className={cn('h-auto', className)}>
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
