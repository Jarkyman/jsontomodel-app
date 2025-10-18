
'use client';

import { useRouter } from 'next/navigation';
import ModelForgeClient from '@/components/ModelForgeClient';
import { useEffect } from 'react';

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

export default function LanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const router = useRouter();
  const langParam = params.language;
  const languageInfo = languages.find((l) => l.value === langParam);

  useEffect(() => {
    if (!languageInfo) {
      // notFound() can't be used in client components.
      // We'll redirect to a 404 page instead.
      router.push('/_not-found');
    }
  }, [languageInfo, router]);

  if (!languageInfo) {
    // Return null or a loading state while redirecting
    return null;
  }

  const langName = languageInfo.label;
  const title = `JSON to ${langName} Converter`;
  const description = `Instantly convert JSON into clean, type-safe ${langName} models.`;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <ModelForgeClient
        selectedLanguage={langParam}
        title={title}
        description={description}
      />
    </main>
  );
}
