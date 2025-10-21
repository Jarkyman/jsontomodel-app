
"use client";

import { useState, useEffect } from 'react';
import { useRouter }from 'next/navigation';
import { Code2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components_ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import ModelForgeLoader from '@/components/ModelForgeLoader';

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

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedJson = localStorage.getItem("jsonInput");
    if (storedJson) {
      setJsonInput(storedJson);
    }
    const storedLang = localStorage.getItem("selectedLanguage");
    if (storedLang) {
      const langExists = languages.some(l => l.value === storedLang);
      if (langExists) {
        setSelectedLanguage(storedLang);
      }
    }
  }, []);
  
  useEffect(() => {
    if(isClient) {
        localStorage.setItem("jsonInput", jsonInput);
        localStorage.setItem("selectedLanguage", selectedLanguage);
    }
  }, [jsonInput, selectedLanguage, isClient]);

  const languageDetails = languages.find(l => l.value === selectedLanguage) || languages[0];
  const title = `JSON to ${languageDetails.label} Converter`;
  const description = `Generate ${languageDetails.label} models from JSON data.`;

  if (!isClient) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
        {/* You can put a loading skeleton here if you want */}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
       <ModelForgeLoader 
          selectedLanguage={selectedLanguage}
          title={title}
          description={description}
       />
    </main>
  );
}
