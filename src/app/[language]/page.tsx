// Required by Cloudflare next-on-pages for dynamic routes
export const runtime = 'edge';
export const preferredRegion = 'auto';

// src/app/[language]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ModelForgeClient from '@/components/ModelForgeClient';

const languages = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'dart', label: 'Flutter (Dart)' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'vbnet', label: 'Visual Basic' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'r', label: 'R' },
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'sql', label: 'SQL' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'erlang', label: 'Erlang' },
  { value: 'scala', label: 'Scala' },
];

export default function LanguagePage() {
  const router = useRouter();
  const params = useParams();
  
  const [language, setLanguage] = useState<string | null>(null);
  const [languageInfo, setLanguageInfo] = useState<{value: string, label: string} | null>(null);

  // Guard clause to ensure params object is available.
  if (!params) {
    return null; 
  }

  useEffect(() => {
    const lang = Array.isArray(params.language) ? params.language[0] : params.language;
    const foundLanguage = languages.find(l => l.value === lang);

    if (lang && foundLanguage) {
      setLanguage(foundLanguage.value);
      setLanguageInfo(foundLanguage);
      document.title = `JSON to ${foundLanguage.label} Converter - Instantly Generate Models`;
    } else if (lang) {
      router.push('/_not-found');
    } else {
      const defaultLang = "typescript";
      router.push(`/${defaultLang}`);
    }
  }, [params, router]);
  
  if (!language || !languageInfo) {
    return null;
  }
  
  const langName = languageInfo.label;
  const title = `JSON to ${langName} Converter`;
  const description = `Instantly convert JSON into clean, type-safe ${langName} models.`;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <ModelForgeClient
        selectedLanguage={language}
        title={title}
        description={description}
      />
    </main>
  );
}
