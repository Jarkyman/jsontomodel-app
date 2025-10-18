"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

type ConsentStatus = 'granted' | 'denied' | null;

export default function CookieConsent() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null);

  useEffect(() => {
    // We can't check localStorage on the server, so we do it here.
    const storedConsent = localStorage.getItem("cookie_consent") as ConsentStatus;
    if (storedConsent) {
        setConsentStatus(storedConsent);
    } else {
        setConsentStatus(null); // Explicitly null if not set
    }
  }, []);

  const handleConsent = (status: 'granted' | 'denied') => {
    localStorage.setItem("cookie_consent", status);
    setConsentStatus(status);
    // Reload to apply script changes, especially to disable scripts if denied.
    window.location.reload(); 
  };
  
  // Don't show the banner if a choice has already been made.
  if (consentStatus !== null) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500",
        consentStatus === null ? "translate-y-0" : "translate-y-full"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}