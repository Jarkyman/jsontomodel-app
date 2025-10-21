// This page must be a Server Component to respect the layout's runtime config.
// Client-side logic is moved to the ModelForgeClient component.
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

interface LanguagePageProps {
  params: {
    language?: string;
  };
}

export default function LanguagePage({ params }: LanguagePageProps) {
  const lang = params.language ?? 'typescript'; // Default to a language
  const languageInfo = languages.find(l => l.value === lang);

  if (!languageInfo) {
    notFound();
  }
  
  const title = `JSON to ${languageInfo.label} Converter`;
  const description = `Instantly convert JSON into clean, type-safe ${languageInfo.label} models.`;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <ModelForgeClient
        selectedLanguage={lang}
        title={title}
        description={description}
      />
    </main>
  );
}
