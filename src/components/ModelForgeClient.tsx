"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { value: "dart", label: "Dart" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "javascript", label: "JavaScript" },
];

const defaultJson = JSON.stringify(
  {
    user: {
      id: 1,
      name: "Jane Doe",
      email: "jane.doe@example.com",
      isActive: true,
      roles: ["admin", "editor"],
    },
  },
  null,
  2
);

export default function ModelForgeClient() {
  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [outputCode, setOutputCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedLang = localStorage.getItem("selectedLanguage");
    if (storedLang) {
      setSelectedLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedLanguage", selectedLanguage);
  }, [selectedLanguage]);

  const handleGenerate = () => {
    try {
      JSON.parse(jsonInput);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please check your JSON input for errors.",
      });
      return;
    }

    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const languageLabel =
        languages.find((l) => l.value === selectedLanguage)?.label || "Model";
      const generatedCode = `// Generated ${languageLabel} model\n// from your JSON structure\n\n${jsonInput}`;
      setOutputCode(generatedCode);
      setIsGenerating(false);
    }, 1000);
  };

  const handleCopy = () => {
    if (outputCode) {
      navigator.clipboard.writeText(outputCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
          Json To Model
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Instantly generate data models from any JSON structure. Select your language and forge your code.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 sm:flex-row sm:max-w-md">
        <div className="relative w-full">
           <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
        <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full sm:w-auto shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
          {isGenerating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          Generate
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">JSON Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON here"
              className="font-code h-96 min-h-[400px] text-sm bg-card"
            />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-2xl">Generated Model</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputCode}>
              {hasCopied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-96 min-h-[400px] w-full rounded-md border bg-card p-4">
              {isGenerating ? (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
              ) : outputCode ? (
                <pre className="h-full w-full overflow-auto font-code text-sm">
                  <code>{outputCode}</code>
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <p>Your generated model will appear here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
