"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type ConsentStatus = 'granted' | 'denied' | null;

export default function AdScripts() {
    const [consent, setConsent] = useState<ConsentStatus>(null);

    useEffect(() => {
        const storedConsent = localStorage.getItem("cookie_consent") as ConsentStatus;
        setConsent(storedConsent);
    }, []);

    if (consent !== 'granted') {
        return null;
    }

    return (
        <>
            <Script
                strategy="beforeInteractive"
                src={`https://fundingchoicesmessages.google.com/i/pub-9894760850635221?ers=1`}
            />
            <Script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9894760850635221"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
        </>
    );
}
