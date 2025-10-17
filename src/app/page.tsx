
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ThemeToggle } from '@/components/theme-toggle';

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
    const storedJson = localStorage.getItem("jsonInputHomepage");
    if (storedJson) {
      setJsonInput(storedJson);
    }
  }, []);

  const handleGenerate = () => {
    try {
      JSON.parse(jsonInput);
      // Store the current JSON and language choice before navigating
      localStorage.setItem("jsonInput", jsonInput);
      localStorage.setItem("selectedLanguage", selectedLanguage);
      router.push(`/${selectedLanguage}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please enter valid JSON before generating models.",
      });
    }
  };
  
  const handleFormatJson = () => {
    if (!jsonInput) return;
    try {
      const parsedJson = JSON.parse(jsonInput);
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      setJsonInput(formattedJson);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "The JSON could not be formatted. Please correct any syntax errors.",
      });
    }
  };

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("jsonInputHomepage", jsonInput);
    }
  }, [jsonInput, isClient]);
  

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
            JSON to Model Converter
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Instantly generate clean, type-safe data models from any JSON structure. Our free code generator accelerates your workflow by creating boilerplate code for over 20 programming languages, including Swift, Kotlin, Dart, TypeScript, and Python.
          </p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Start Generating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON here"
                  className="font-code h-64 resize-y"
                  aria-label="JSON Input Area"
                />
                 <Button variant="outline" size="sm" onClick={handleFormatJson} disabled={!jsonInput} className="absolute bottom-2 right-2">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Format
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-auto flex-grow">
                  <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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
                <Button onClick={handleGenerate} size="lg" className="w-full sm:w-auto">
                  Generate Models
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="py-8">
          <h2 className="font-headline text-3xl font-bold text-center mb-6">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is a JSON to Model converter?</AccordionTrigger>
              <AccordionContent>
                A JSON to Model converter is a developer tool that automates the creation of <strong>type-safe</strong> <strong>data models</strong> and <strong>JSON classes</strong> from a given JSON structure. This process saves significant time by generating boilerplate code for various programming languages, including <strong>Swift</strong>, <strong>Kotlin</strong>, <strong>Dart</strong>, <strong>TypeScript</strong>, <strong>Python</strong>, <strong>Java</strong>, <strong>C#</strong>, <strong>Go</strong>, and <strong>PHP</strong>. Our <strong>code generator</strong> ensures your models are accurate and consistent with your data.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-2">
            <AccordionTrigger>Which languages does this code generator support?</AccordionTrigger>
            <AccordionContent>
              Our <strong>JSON converter</strong> supports a wide range of popular languages essential for modern development. You can generate models for <strong>TypeScript</strong>, <strong>Flutter (Dart)</strong>, <strong>Kotlin</strong>, <strong>Swift</strong>, <strong>Python</strong>, <strong>Java</strong>, <strong>C#</strong>, <strong>Go</strong>, <strong>PHP</strong>, <strong>JavaScript</strong>, <strong>C++</strong>, <strong>Visual Basic</strong>, <strong>Rust</strong>, <strong>Ruby</strong>, <strong>R</strong>, <strong>Objective-C</strong>, <strong>SQL</strong>, <strong>Elixir</strong>, <strong>Erlang</strong>, and <strong>Scala</strong>. We are always working to expand our language support.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How do I generate a type-safe model for Swift or Kotlin?</AccordionTrigger>
            <AccordionContent>
              It's simple. Paste your JSON data into the input field on the left, then select your desired language—like <strong>Swift</strong> or <strong>Kotlin</strong>—from the dropdown menu. The corresponding <strong>data models</strong> will be generated instantly on the right. You can further tailor the output using the options provided for each language, such as making properties optional or choosing between `structs` and `classes`.
            </AccordionContent>
          </AccordionItem>
           <AccordionItem value="item-4">
            <AccordionTrigger>Why is a JSON to data model tool useful?</AccordionTrigger>
            <AccordionContent>
              Using a <strong>JSON to model</strong> tool is crucial for efficiency and code quality. It eliminates manual, error-prone work, ensuring that your <strong>type-safe</strong> models perfectly match your JSON data. This is especially useful in projects that consume APIs, as it helps prevent runtime errors caused by mismatched data types in languages like <strong>TypeScript</strong>, <strong>Dart</strong>, or <strong>Java</strong>.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Is this JSON to Model converter free to use?</AccordionTrigger>
            <AccordionContent>
              Yes, absolutely! Our <strong>code generator</strong> is completely free to use. We believe in providing powerful, accessible tools to help developers streamline their workflows without any cost.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>How does the tool handle complex or nested JSON?</AccordionTrigger>
            <AccordionContent>
                Our <strong>JSON converter</strong> is designed to handle even deeply nested JSON objects and arrays. It intelligently traverses your entire JSON structure, automatically creating separate <strong>data models</strong> or classes for each nested object. This ensures that your entire data structure is correctly and fully represented in the generated code for languages like <strong>Python</strong>, <strong>Java</strong>, and <strong>C#</strong>.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7">
            <AccordionTrigger>Can I customize the generated code?</AccordionTrigger>
            <AccordionContent>
                Yes. For each supported language, we provide a range of options to fine-tune the output. You can control things like nullability, making fields final or readonly, generating helper methods (like `fromJson` or `copyWith`), and choosing between `classes` and `structs` in languages like <strong>Swift</strong>. This flexibility allows the <strong>code generator</strong> to fit perfectly into your existing project's coding style.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-8">
            <AccordionTrigger>Is my JSON data safe? Is it sent to your servers?</AccordionTrigger>
            <AccordionContent>
                Your data is completely safe. All JSON processing and <strong>code generation</strong> happen entirely within your browser. We do not send your JSON data to our servers, ensuring your information remains private and secure.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-9">
            <AccordionTrigger>What are "type-safe" models and why are they important?</AccordionTrigger>
            <AccordionContent>
                A <strong>type-safe model</strong> is a class or struct where each property has a specific data type (e.g., `String`, `Int`, `Bool`). This is a cornerstone of modern, robust programming in languages like <strong>TypeScript</strong>, <strong>Swift</strong>, and <strong>Kotlin</strong>. Using type-safe models helps you catch data-related bugs at compile time, rather than discovering them as crashes at runtime. It also improves code readability and enables better autocompletion in your IDE.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-10">
            <AccordionTrigger>How can I change the name of the main model?</AccordionTrigger>
            <AccordionContent>
              The main model generated from your JSON is named "DataModel" by default. You can easily change this. Once you've generated your code, click the "Rename" button located at the top of the output panel. A dialog will appear, allowing you to enter a new name for your root <strong>JSON class</strong>.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-11">
            <AccordionTrigger>How do I format my JSON code?</AccordionTrigger>
            <AccordionContent>
              Yes, you can! If your JSON is minified or poorly formatted, it can be hard to read. Our tool includes a built-in <strong>JSON formatter</strong>. Simply paste your code into the 'JSON Input' panel and click the 'Format' button. This will automatically <strong>pretty-print</strong> your JSON, adding proper indentation and line breaks, which significantly improves <strong>code readability</strong> and helps you spot any structural errors.
            </AccordionContent>
          </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
}

    