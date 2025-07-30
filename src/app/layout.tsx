import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'JSON to Model Converter | Generate Code in 20+ Languages',
  description:
    'Instantly generate clean, type-safe data models and classes from any JSON structure. Supports over 20 programming languages including Swift, Kotlin, TypeScript, Python, Dart, and Rust. Free and easy to use.',
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
    title: 'JSON to Model Converter | Generate Code in 20+ Languages',
    description:
      'Instantly generate clean, type-safe data models from any JSON structure.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
