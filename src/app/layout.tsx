import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';
import Analytics from '@/components/Analytics';
import SuspenseWrapper from '@/components/SuspenseWrapper';
import CookieConsent from '@/components/CookieConsent';
import AdScripts from '@/components/AdScripts';

export const metadata: Metadata = {
  title: 'JSON to Model - Generate Code for Swift, Kotlin, Dart, and More',
  description:
    'Easily convert JSON to type-safe models in Swift, Kotlin, Dart, TypeScript, Python, and more. Free, fast, and developer-friendly.',
  keywords: [
    'json to model',
    'json converter',
    'code generator',
    'swift',
    'kotlin',
    'typescript',
    'python',
    'dart',
    'rust',
    'java',
    'c#',
    'go',
    'php',
    'data models',
    'type-safe',
    'json classes',
  ],
  openGraph: {
    title: 'JSON to Model - Generate Code for Swift, Kotlin, Dart, and More',
    description:
      'Easily convert JSON to type-safe models in Swift, Kotlin, Dart, TypeScript, Python, and more. Free, fast, and developer-friendly.',
    type: 'website',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <SuspenseWrapper>
          <AdScripts />
        </SuspenseWrapper>
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "https://jsontomodel.com",
            "logo": "https://jsontomodel.com/favicon.ico"
          }`}
        </script>
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <CookieConsent />
        </ThemeProvider>
        <SuspenseWrapper>
          <Analytics />
        </SuspenseWrapper>
      </body>
    </html>
  );
}
