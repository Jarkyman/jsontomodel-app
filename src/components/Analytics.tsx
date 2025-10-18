
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';

type ConsentStatus = 'granted' | 'denied' | null;

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    const storedConsent = localStorage.getItem("cookie_consent") as ConsentStatus;
    setConsent(storedConsent);
  }, []);

  useEffect(() => {
    if (consent === 'granted' && pathname) {
      pageview(new URL(pathname, window.location.origin));
    }
  }, [pathname, searchParams, consent]);

  if (consent !== 'granted') {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
