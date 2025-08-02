"use client";

import { useEffect, useRef } from "react";
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
  const adInitialized = useRef(false); // 🔐 Prevent double init

  useEffect(() => {
    if (adInitialized.current) return;

    const ins = adRef.current?.querySelector("ins.adsbygoogle") as HTMLElement | null;

    // Check both AdSense's internal flag AND our own
    if (ins && !ins.getAttribute("data-ad-status")) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true; // ✅ Mark as pushed
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [adClient, adSlot]);

  return (
    <div ref={adRef} className={cn("h-auto", className)}>
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
