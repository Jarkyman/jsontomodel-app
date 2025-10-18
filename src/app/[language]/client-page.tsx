"use client";

import ModelForgeClient from '@/components/ModelForgeClient';
import { ThemeToggle } from '@/components/theme-toggle';

interface LanguageClientPageProps {
  selectedLanguage: string;
  title: string;
  description: string;
}

export default function LanguageClientPage({
  selectedLanguage,
  title,
  description,
}: LanguageClientPageProps) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <ModelForgeClient
        selectedLanguage={selectedLanguage}
        title={title}
        description={description}
      />
    </main>
  );
}