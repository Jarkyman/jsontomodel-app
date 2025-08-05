
import { ThemeToggle } from '@/components/theme-toggle';
import ModelForgeLoader from '@/components/ModelForgeLoader';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

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

export async function generateMetadata({ params }: { params: { language: string } }): Promise<Metadata> {
  const langParam = params.language;
  const languageInfo = languages.find(l => l.value === langParam);

  if (!languageInfo) {
    return {
      title: 'JSON to Model - Page Not Found',
      description: 'The requested language is not supported.',
    };
  }

  const langName = languageInfo.label;
  const title = `JSON to ${langName} Converter | Generate ${langName} Models`;
  const description = `Instantly convert JSON into clean, type-safe ${langName} models. Our free code generator simplifies your workflow, saving you time and effort.`;

  return {
    title,
    description,
    keywords: [
        `json to ${langName.toLowerCase()}`,
        'json converter',
        'code generator',
        langName.toLowerCase(),
        'data models',
        'type-safe',
        'json classes',
    ],
    openGraph: {
        title,
        description,
        type: 'website',
    },
    robots: 'index, follow',
  };
}

export default function LanguagePage({ params }: { params: { language: string } }) {
  const langParam = params.language;
  const languageInfo = languages.find(l => l.value === langParam);

  if (!languageInfo) {
    notFound();
  }
  
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <ModelForgeLoader selectedLanguage={langParam} />
    </main>
  );
}

export async function generateStaticParams() {
    return languages.map(lang => ({
        language: lang.value,
    }));
}
