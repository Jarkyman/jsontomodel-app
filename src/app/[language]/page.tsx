// src/app/[language]/page.tsx

import { notFound } from 'next/navigation';
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

export function generateStaticParams() {
  return languages.map((lang) => ({
    language: lang.value,
  }));
}

type LanguageParams = { language?: string };

// Small helper to safely normalize params that might be a value or a Promise.
async function resolveLanguage(params: LanguageParams | Promise<LanguageParams> | undefined): Promise<string | undefined> {
  const resolved = await Promise.resolve(params ?? {});
  const lang = resolved.language;

  if (typeof lang === "string" && lang.length > 0 && languages.some(l => l.value === lang)) {
    return lang;
  }
  // Return undefined if not a valid language to trigger notFound()
  return undefined;
}

export async function generateMetadata(props: any) {
  const language = await resolveLanguage(props?.params);
  const languageInfo = languages.find((l) => l.value === language);
  const langName = languageInfo?.label || 'Model';

  return {
    title: `JSON to ${langName} Converter - Instantly Generate Models`,
    description: `Easily and freely convert any JSON structure into clean, type-safe ${langName} models and classes. Supports nullable types, custom prefixes, and more.`,
  };
}

export default async function LanguagePage(props: any) {
  const language = await resolveLanguage(props?.params);
  const languageInfo = languages.find((l) => l.value === language);

  if (!languageInfo) {
    notFound();
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
