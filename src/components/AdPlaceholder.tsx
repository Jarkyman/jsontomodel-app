"use client";

import { useEffect, useState } from 'react';
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
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    const pushAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    };

    const timeoutId = setTimeout(pushAd, 50);

    return () => clearTimeout(timeoutId);
  }, [adClient, adSlot]);

  useEffect(() => {
    const adElement = document.querySelector(`ins[data-ad-slot="${adSlot}"]`);
    if (!adElement) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (adElement.getAttribute('data-ad-status') === 'filled') {
                setAdLoaded(true);
                observer.disconnect();
            }
        });
    });

    observer.observe(adElement, { attributes: true });

    return () => observer.disconnect();
  }, [adSlot]);

  return (
    <div className={cn(className, adLoaded ? 'h-auto' : 'h-0 transition-[height]')}>
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
