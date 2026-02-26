
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  Sparkles,
  Wand2,
  Layers,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const highlights = [
  {
    title: "Instant Code Generation",
    description:
      "Paste your JSON and get clean models with serialization helpers tailored to your tech stack.",
    icon: Sparkles,
  },
  {
    title: "Production Ready Output",
    description:
      "Generate type-safe classes that follow best practices for nullability, naming, and validation.",
    icon: ShieldCheck,
  },
  {
    title: "Save Hours of Work",
    description:
      "Go from raw API responses to usable models in seconds, so you can ship features faster.",
    icon: Timer,
  },
];

const faqs = [
  {
    question: "Which languages does JSON to Model support?",
    answer:
      "We support 20+ popular languages and frameworks including TypeScript, Swift, Kotlin, Dart, Python, C#, Go, PHP, JavaScript, Rust, and many more.",
  },
  {
    question: "How does the generator work?",
    answer:
      "Paste your JSON, pick a target language, and hit Generate. We analyze the structure and create models, fields, and helper methods automatically.",
  },
  {
    question: "Is there a TypeScript-specific generator?",
    answer:
      "Yes. Our TypeScript generator supports interfaces, classes, optional chaining, and JSON serialization helpers tailored for modern React or Node.js apps.",
  },
  {
    question: "What makes the Swift generator special?",
    answer:
      "Swift output includes `Codable` structs, snake-to-camel case mapping, and optional handling so your iOS models stay in sync with API payloads.",
  },
  {
    question: "How does JSON to Model help with Flutter and Dart?",
    answer:
      "We generate Dart classes with `fromJson`, `toJson`, null safety, and copyWith helpers to keep your Flutter state immutable and type-safe.",
  },
  {
    question: "Does Kotlin output work with Android projects?",
    answer:
      "Absolutely. We create Kotlin data classes with nullable annotations, default values, and serialization adapters compatible with Moshi or kotlinx.serialization.",
  },
  {
    question: "What about JavaScript or Node.js?",
    answer:
      "You can generate JSDoc-annotated objects or class-based models for Node.js services, making it easier to validate incoming data.",
  },
  {
    question: "Can I customize the output?",
    answer:
      "Absolutely. Each language page lets you adjust naming, nullability, serialization, and other options so the models match your project.",
  },
  {
    question: "Do you store my JSON data?",
    answer:
      "No. All conversions run directly in your browser. We only persist your preferences locally to improve the experience.",
  },
];

const defaultJson = JSON.stringify(
  {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    isActive: true,
    createdAt: "2025-07-31T10:00:00Z",
    roles: ["admin", "editor"],
    profile: {
      age: 30,
      country: "Denmark",
    },
  },
  null,
  2,
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
      const langExists = languages.some((l) => l.value === storedLang);
      if (langExists) {
        setSelectedLanguage(storedLang);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jsonInput", jsonInput);
  }, [jsonInput]);

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    localStorage.setItem("selectedLanguage", newLang);
  };

  const handleFormatJson = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Empty input",
        description: "Add some JSON before trying to format it.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      toast({
        title: "JSON formatted",
        description: "Your JSON has been prettified.",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "We couldn't parse your input. Make sure commas and quotes are in the right places.",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    if (!selectedLanguage) {
      toast({
        title: "Pick a language",
        description: "Choose the target language before generating models.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("jsonInput", jsonInput);
    router.push(`/${selectedLanguage}`);
  };

  return (
    <main className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <div className="text-center">
            <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Convert JSON into strongly typed models in seconds
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Paste your JSON, choose your target language, and let us generate the boilerplate. Perfect for developers
              who want to ship fast and avoid manual mistakes.
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1 text-left">
              <CardTitle className="text-2xl font-semibold">
                Paste your JSON data
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                We never store your payloads; everything is generated locally in your browser.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Textarea
                  value={jsonInput}
                  onChange={(event) => setJsonInput(event.target.value)}
                  placeholder="Paste or write your JSON here..."
                  className="font-code h-64 resize-none rounded-lg border border-border bg-muted/50 p-4 pr-28 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="JSON input"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-3 right-3 gap-2"
                  onClick={handleFormatJson}
                >
                  <Layers className="h-4 w-4" />
                  Format JSON
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Code2 className="h-4 w-4" />
                    Choose language
                  </div>
                  <Select
                    value={selectedLanguage}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger className="mt-2 w-full sm:w-72">
                      <SelectValue placeholder="Pick a language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="mt-2 w-full sm:mt-6 sm:w-auto"
                  onClick={handleGenerate}
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Informational SEO/AdSense Content Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border mt-8">
        <div className="mx-auto w-full max-w-4xl prose prose-slate dark:prose-invert">
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-8">
            How JSON to Model Works
          </h2>

          <p className="lead text-lg text-center text-muted-foreground mb-12">
            The modern standard for converting raw JSON payloads into production-ready data structures across 20+ programming languages.
          </p>

          <div className="grid md:grid-cols-2 gap-12 not-prose">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                <h3 className="text-xl font-bold">Paste your API Payload</h3>
              </div>
              <p className="text-muted-foreground pl-11">
                Start by pasting a sample JSON response from your API, database export, or configuration file. Our engine analyzes the structure, types, and nested objects immediately.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                <h3 className="text-xl font-bold">Select a Language</h3>
              </div>
              <p className="text-muted-foreground pl-11">
                Choose from over 20 supported languages and frameworks including Swift, Kotlin, Dart (Flutter), TypeScript, Python, and Go.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                <h3 className="text-xl font-bold">Configure Options</h3>
              </div>
              <p className="text-muted-foreground pl-11">
                Tweak the generated code using framework-specific settings. Toggle features like `Codable` for Swift, Null Safety for Dart, or Moshi/Gson annotations for Kotlin.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">4</div>
                <h3 className="text-xl font-bold">Export Type-Safe Code</h3>
              </div>
              <p className="text-muted-foreground pl-11">
                Copy the generated, beautifully formatted data classes directly into your project. Instantly eliminate manual typing errors and tedious boilerplate.
              </p>
            </div>
          </div>

          <div className="mt-16 pt-12 border-t border-border space-y-8">
            <h2 className="text-2xl font-bold">Supported Languages & Frameworks</h2>
            <p>
              Depending on your stack, parsing JSON can range from trivial to incredibly frustrating. Our goal is to provide native-feeling schemas for every ecosystem:
            </p>

            <ul className="grid sm:grid-cols-2 gap-4">
              <li className="flex flex-col gap-1 p-4 bg-muted/20 rounded-lg border border-border">
                <strong>Swift (iOS/macOS)</strong>
                <span className="text-sm text-muted-foreground">Generates Codable structs with custom CodingKeys for seamless bridging to REST APIs.</span>
              </li>
              <li className="flex flex-col gap-1 p-4 bg-muted/20 rounded-lg border border-border">
                <strong>Kotlin (Android)</strong>
                <span className="text-sm text-muted-foreground">Creates Data Classes compatible with kotlinx.serialization or Moshi.</span>
              </li>
              <li className="flex flex-col gap-1 p-4 bg-muted/20 rounded-lg border border-border">
                <strong>Dart (Flutter)</strong>
                <span className="text-sm text-muted-foreground">Implements json_serializable support with strict null-safety and copyWith methods.</span>
              </li>
              <li className="flex flex-col gap-1 p-4 bg-muted/20 rounded-lg border border-border">
                <strong>TypeScript</strong>
                <span className="text-sm text-muted-foreground">Outputs strict Interfaces or Zod validation schemas for modern web apps.</span>
              </li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              We also fully support Python, Java, C#, Go, PHP, JavaScript, C++, Visual Basic, Rust, Ruby, R, Objective-C, SQL, Elixir, Erlang, and Scala.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Why developers choose JSON to Model
            </h2>
            <p className="mt-2 text-muted-foreground">
              A modern development workflow that keeps your data models sharp, no matter which platforms you build for.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((highlight) => (
              <Card key={highlight.title} className="h-full">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <highlight.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {highlight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {highlight.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about JSON to Model, written for both developers and search engines.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-8 space-y-4"
          >
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}
