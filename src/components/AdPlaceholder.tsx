"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  const adInitialized = useRef(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    if (adInitialized.current) return;

    const insElement = adRef.current?.querySelector("ins.adsbygoogle") as HTMLElement | null;

    if (insElement && !insElement.getAttribute("data-ad-status")) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true;
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [adClient, adSlot]);

  useEffect(() => {
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

  return (
    <div 
      ref={adRef} 
      className={cn(
        "h-auto transition-all duration-300", 
        !isAdLoaded && "h-0 opacity-0", // Hide until loaded
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

    