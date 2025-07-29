
"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Languages, Loader2, Pencil, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateDartCode, DartGeneratorOptions } from "@/lib/dart-generator";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { ToastAction } from "./ui/toast";
import { cn } from "@/lib/utils";
import { LineNumberedTextarea } from "./LineNumberedTextarea";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

const languages = [
  { value: "dart", label: "Flutter (Dart)" },
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
    "id": 123,
    "name": "Test User",
    "email": "test@example.com",
    "is_active": true,
    "created_at": "2025-07-29T12:00:00Z",
    "score": 89.75,
    "preferences": {
      "newsletter": false,
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    },
    "roles": ["admin", "editor", "viewer"],
    "tags": [],
    "profile_picture": null,
    "address": {
      "street": "123 Example St",
      "city": "Copenhagen",
      "zipcode": "2100",
      "coordinates": {
        "lat": 55.6761,
        "lng": 12.5683
      }
    },
    "projects": [
      {
        "id": "p1",
        "title": "Website Redesign",
        "status": "active",
        "budget": 10000,
        "members": [
          {
            "id": "u1",
            "name": "Alice"
          },
          {
            "id": "u2",
            "name": "Bob"
          }
        ]
      },
      {
        "id": "p2",
        "title": "Mobile App",
        "status": "planning",
        "budget": 5000,
        "members": []
      }
    ]
  },
  null,
  2
);

const initialOptions: DartGeneratorOptions = {
    fromJson: true,
    toJson: true,
    copyWith: false,
    toString: false,
    nullableFields: true,
    requiredFields: false,
    finalFields: true,
    defaultValues: false,
    supportDateTime: true,
    camelCaseFields: false,
};

type OptionKey = keyof DartGeneratorOptions;

const FilterButton = ({ onClick, checked, label, id }: { onClick: () => void, checked: boolean, label: string, id: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
      checked
        ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
        : 'border-input bg-transparent hover:bg-accent hover:text-accent-foreground'
    )}
    aria-pressed={checked}
  >
    {label}
  </button>
);


export default function ModelForgeClient() {
  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [outputCode, setOutputCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("dart");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [rootClassName, setRootClassName] = useState("DataModel");
  const [renameInputValue, setRenameInputValue] = useState(rootClassName);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [dartOptions, setDartOptions] = useState<DartGeneratorOptions>(initialOptions);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      } else {
        setJsonError("An unknown JSON parsing error occurred.");
      }
    }
  };

  useEffect(() => {
    validateJson(jsonInput);
  }, []);

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonInput(newValue);
    validateJson(newValue);
  };

  useEffect(() => {
    const storedLang = localStorage.getItem("selectedLanguage");
    if (storedLang) {
      setSelectedLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedLanguage", selectedLanguage);
  }, [selectedLanguage]);
  
  useEffect(() => {
    if (hasGenerated) {
      generateCode(selectedLanguage, rootClassName, dartOptions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dartOptions, rootClassName, selectedLanguage]);


  useEffect(() => {
    setRenameInputValue(rootClassName);
  }, [rootClassName]);

  const generateCode = (targetLanguage: string, name: string, options: DartGeneratorOptions) => {
    if (jsonError) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please fix the errors in your JSON input before generating.",
      });
      return;
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonInput);
    } catch (error) {
       // This should ideally not be reached due to live validation, but as a fallback
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please check your JSON input for errors.",
      });
      return;
    }

    setIsGenerating(true);
    setOutputCode('');
    try {
      if (targetLanguage === "dart") {
        const result = generateDartCode(parsedJson, name, options);
        setOutputCode(result);
        
        if (result && !hasGenerated) {
            toast({
                title: "Model Generated",
                description: `Your root model is named "${name}". You can rename it.`,
                action: (
                    <ToastAction altText="Rename" onClick={() => setIsRenameDialogOpen(true)}>
                        Rename
                    </ToastAction>
                ),
            });
        }
      } else {
        toast({
          title: "Not Implemented",
          description: `Code generation for ${targetLanguage} is not yet supported.`,
        });
        setOutputCode("");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Generating Model",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
      setHasGenerated(true);
    }
  };
  
  const handleToggleOption = (option: OptionKey) => {
    setDartOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };
  
  const handleGenerate = () => {
    generateCode(selectedLanguage, "DataModel", dartOptions);
  };
  
  const handleRename = () => {
    if (renameInputValue.trim()) {
      const newName = renameInputValue.trim();
      setRootClassName(newName);
      setIsRenameDialogOpen(false);
    }
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
        <Button onClick={handleGenerate} disabled={isGenerating || !!jsonError} size="lg" className="w-full sm:w-auto shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
          {isGenerating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          Generate
        </Button>
      </div>

      {selectedLanguage === 'dart' && (
      <Card className="max-w-xl mx-auto shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton id="fromJson" checked={dartOptions.fromJson} onClick={() => handleToggleOption('fromJson')} label="fromJson" />
                <FilterButton id="toJson" checked={dartOptions.toJson} onClick={() => handleToggleOption('toJson')} label="toJson" />
                <FilterButton id="copyWith" checked={dartOptions.copyWith} onClick={() => handleToggleOption('copyWith')} label="copyWith" />
                <FilterButton id="toString" checked={dartOptions.toString} onClick={() => handleToggleOption('toString')} label="toString" />
                <FilterButton id="nullableFields" checked={dartOptions.nullableFields} onClick={() => handleToggleOption('nullableFields')} label="nullable" />
                <FilterButton id="requiredFields" checked={dartOptions.requiredFields} onClick={() => handleToggleOption('requiredFields')} label="required" />
                <FilterButton id="finalFields" checked={dartOptions.finalFields} onClick={() => handleToggleOption('finalFields')} label="final" />
                <FilterButton id="defaultValues" checked={dartOptions.defaultValues} onClick={() => handleToggleOption('defaultValues')} label="default values" />
                <FilterButton id="supportDateTime" checked={dartOptions.supportDateTime} onClick={() => handleToggleOption('supportDateTime')} label="support DateTime" />
                <FilterButton id="camelCaseFields" checked={dartOptions.camelCaseFields} onClick={() => handleToggleOption('camelCaseFields')} label="camelCase" />
          </div>
        </CardContent>
      </Card>
      )}


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">JSON Input</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="flex-grow h-full">
                <LineNumberedTextarea
                value={jsonInput}
                onChange={handleJsonInputChange}
                placeholder="Paste your JSON here"
                className="min-h-[400px] h-full"
                containerClassName={cn({
                    "border-destructive focus-within:ring-destructive focus-within:ring-2": jsonError,
                })}
                />
            </div>
             {jsonError && (
              <p className="mt-2 flex items-center text-sm text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                {jsonError}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="font-headline text-2xl">Generated Model</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!outputCode || isGenerating}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rename Root Model</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter a new name for the root model class. The current name is <strong>{rootClassName}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input 
                    value={renameInputValue}
                    onChange={(e) => setRenameInputValue(e.target.value)}
                    placeholder="Enter new name"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRename}>Rename</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputCode}>
                {hasCopied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                <span className="sr-only">Copy to clipboard</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="relative flex-grow border rounded-md bg-card font-code text-sm overflow-hidden">
              {isGenerating ? (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
              ) : outputCode ? (
                <div className="relative h-full w-full overflow-auto">
                    <div className="flex absolute inset-0">
                        <div className="w-10 select-none text-right text-muted-foreground pt-3 pr-4 bg-card">
                            {outputCode.split('\n').map((_, index) => (
                                <div key={index}>{index + 1}</div>
                            ))}
                        </div>
                        <pre className="flex-1 p-3">
                            <code>{outputCode}</code>
                        </pre>
                    </div>
                </div>

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
    

    
