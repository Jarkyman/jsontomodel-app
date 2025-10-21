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
  const langParam = params.language;

  const [language, setLanguage] = useState<string | null>(null);
  const [languageInfo, setLanguageInfo] = useState<{value: string, label: string} | null>(null);

  useEffect(() => {
    const lang = Array.isArray(langParam) ? langParam[0] : langParam;
    const foundLanguage = languages.find(l => l.value === lang);

    if (lang && foundLanguage) {
      setLanguage(foundLanguage.value);
      setLanguageInfo(foundLanguage);
      document.title = `JSON to ${foundLanguage.label} Converter - Instantly Generate Models`;
    } else if (lang) {
      // If a language is in the URL but invalid, redirect to not found.
      router.push('/_not-found');
    } else {
      // Default to typescript if no language is specified
      const defaultLang = "typescript";
      const defaultLangInfo = languages.find(l => l.value === defaultLang);
      setLanguage(defaultLang);
      setLanguageInfo(defaultLangInfo!);
      document.title = `JSON to ${defaultLangInfo!.label} Converter - Instantly Generate Models`;
    }
  }, [langParam, router]);
  
  if (!language || !languageInfo) {
    // This will show a loading state or blank screen while useEffect runs.
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
