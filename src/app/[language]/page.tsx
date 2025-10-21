
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ModelForgeLoader from '@/components/ModelForgeLoader';
import { Loader2 } from 'lucide-react';

const languages = [
  { value: "typescript", label: "TypeScript" },
  { value: "dart", label: "Flutter (Dart)" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "javascript", label: "JavaScript" },
  { value: "cpp", label: "C++" },
  { value: "vbnet", label: "Visual Basic" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "r", label: "R" },
  { value: "objectivec", label: "Objective-C" },
  { value: "sql", label: "SQL" },
  { value: "elixir", label: "Elixir" },
  { value: "erlang", label: "Erlang" },
  { value: "scala", label: "Scala" },
];

export default function LanguagePage() {
  const router = useRouter();
  const params = useParams();
  const [isClient, setIsClient] = useState(false);
  const [isValidLanguage, setIsValidLanguage] = useState(false);
  
  const langParam = params.language;
  const language = typeof langParam === 'string' ? langParam : '';

  useEffect(() => {
    setIsClient(true);
    const langExists = languages.some(l => l.value === language);
    if (language && langExists) {
      setIsValidLanguage(true);
      localStorage.setItem("selectedLanguage", language);
    } else if (language) {
      router.replace('/_not-found');
    }
  }, [language, router]);
  
  if (!isClient || !isValidLanguage) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  const languageDetails = languages.find(l => l.value === language) || languages[0];
  const title = `JSON to ${languageDetails.label} Converter`;
  const description = `Generate ${languageDetails.label} models from JSON data.`;

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
       <ModelForgeLoader 
          selectedLanguage={language}
          title={title}
          description={description}
       />
    </main>
  );
}
