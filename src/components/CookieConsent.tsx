"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

type ConsentStatus = 'granted' | 'denied' | null;

export default function CookieConsent() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // We can't check localStorage on the server, so we do it here.
    const storedConsent = localStorage.getItem("cookie_consent") as ConsentStatus;
    const storedDismissed = localStorage.getItem("cookie_consent_dismissed") === "true";
    setConsentStatus(storedConsent ?? null);
    setIsDismissed(storedDismissed);
    setHasLoaded(true);
  }, []);

  const handleConsent = (status: 'granted' | 'denied') => {
    localStorage.setItem("cookie_consent", status);
    setConsentStatus(status);

    if (status === 'granted') {
      localStorage.setItem("cookie_consent_dismissed", "true");
      setIsDismissed(true);
      // Reload so analytics / ads can pick up the new consent immediately.
      window.location.reload();
      return;
    }

    localStorage.removeItem("cookie_consent_dismissed");
    setIsDismissed(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("cookie_consent", "denied");
    localStorage.setItem("cookie_consent_dismissed", "true");
    setConsentStatus('denied');
    setIsDismissed(true);
  };
  
  if (!hasLoaded) {
    return null;
  }

  const shouldShowBanner = !isDismissed && consentStatus !== 'granted';

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500",
        shouldShowBanner ? "translate-y-0" : "translate-y-full"
      )}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience, analyze site traffic, and for advertising purposes. By clicking
            &quot;Accept&quot;, you consent to our use of cookies.
          </p>
          <div className="flex-shrink-0 flex gap-2">
            <Button onClick={() => handleConsent('denied')} variant="outline" size="sm">
              Decline
            </Button>
            <Button onClick={() => handleConsent('granted')} size="sm">
              Accept
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
