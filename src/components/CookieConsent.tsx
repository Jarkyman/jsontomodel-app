"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // We can't check localStorage on the server, so we do it here.
    const consent = localStorage.getItem("cookie_consent");
    if (consent !== "true") {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500",
        showConsent ? "translate-y-0" : "translate-y-full"
      )}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience, analyze site traffic, and for advertising purposes. By clicking
            &quot;Accept&quot;, you consent to our use of cookies.
          </p>
          <div className="flex-shrink-0">
            <Button onClick={acceptCookies} size="sm">
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
