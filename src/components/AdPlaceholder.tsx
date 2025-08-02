"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

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
  fullWidthResponsive = true,
}: AdPlaceholderProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [shouldShowFallback, setShouldShowFallback] = useState(false);

  useEffect(() => {
    // This timer will trigger the fallback if the ad doesn't load within a reasonable time.
    const fallbackTimer = setTimeout(() => {
        if (!isAdLoaded) {
            setShouldShowFallback(true);
        }
    }, 2000); // 2 seconds delay

    return () => clearTimeout(fallbackTimer);
  }, [isAdLoaded]);


  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
      setIsAdLoaded(false); // Ensure we know it failed
    }

    const insElement = adRef.current?.querySelector("ins.adsbygoogle");
    if (!insElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-ad-status"
        ) {
          if (insElement.getAttribute("data-ad-status") === "filled") {
            setIsAdLoaded(true);
            setShouldShowFallback(false); // Ad loaded, don't show fallback
            observer.disconnect();
          }
        }
      });
    });

    observer.observe(insElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (shouldShowFallback) {
    return <Separator className={cn("my-6", className)} />;
  }

  return (
    <div 
      ref={adRef} 
      className={cn(
        "h-auto transition-all duration-300",
        // Hide container until ad is loaded to prevent layout shifts
        !isAdLoaded && "h-0 opacity-0",
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      ></ins>
    </div>
  );
}
