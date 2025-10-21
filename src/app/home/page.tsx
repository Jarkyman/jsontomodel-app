
"use client";

import { useState, useEffect } from 'react';
import { useRouter }from 'next/navigation';
import { Code2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

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

const defaultJson = JSON.stringify(
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "isActive": true,
    "createdAt": "2025-07-31T10:00:00Z",
    "roles": ["admin", "editor"],
    "profile": {
      "age": 30,
      "country": "Denmark"
    }
  },
  null,
  2
);

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");

  useEffect(() => {
    const storedJson = localStorage.getItem("jsonInput");
    if (storedJson) {
      setJsonInput(storedJson);
    }
    const storedLang = localStorage.getItem("selectedLanguage");
    if (storedLang) {
      const langExists = languages.some(l => l.value === storedLang);
      if (langExists) {
        setSelectedLanguage(storedLang);
        // Navigate to the stored language path on initial load if it exists
        router.replace(`/${storedLang}`);
      }
    }
  }, [router]);
  
  useEffect(() => {
    localStorage.setItem("jsonInput", jsonInput);
  }, [jsonInput]);

  const handleLanguageChange = (newLang: string) => {
      setSelectedLanguage(newLang);
      localStorage.setItem("selectedLanguage", newLang);
      router.push(`/${newLang}`);
  };

  const languageDetails = languages.find(l => l.value === selectedLanguage) || languages[0];
  const title = `JSON to Model Converter`;
  const description = `Select a language to get started. Your JSON will be converted instantly.`;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
        <div className="absolute top-4 right-4">
            <ThemeToggle />
        </div>
       <div className="w-full max-w-2xl space-y-8 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
                {title}
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                {description}
            </p>

             <section aria-labelledby="language-selection" className="mx-auto flex w-full max-w-sm items-center gap-4">
                <h2 id="language-selection" className="sr-only">Language Selection</h2>
                <div className="relative w-full">
                <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full pl-10">
                    <SelectValue placeholder="Select language..." />
                    </SelectTrigger>
                    <SelectContent>
                    {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </section>
            <Separator />
            <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here to have it saved for the next step"
                className="font-code h-64 resize-none"
                aria-label="JSON Input Area"
            />
       </div>
    </main>
  );
}
