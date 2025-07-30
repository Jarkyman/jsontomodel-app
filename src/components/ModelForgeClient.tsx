
"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code2, Loader2, Pencil, AlertCircle, Wand2 } from "lucide-react";
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
import { generateKotlinCode, KotlinGeneratorOptions } from "@/lib/kotlin-generator";
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
import { Textarea } from "./ui/textarea";

const languages = [
  { value: "dart", label: "Flutter (Dart)", supported: true },
  { value: "kotlin", label: "Kotlin", supported: true },
  { value: "swift", label: "Swift", supported: false },
  { value: "python", label: "Python", supported: false },
  { value: "java", label: "Java", supported: false },
  { value: "csharp", label: "C#", supported: false },
  { value: "typescript", label: "TypeScript", supported: false },
  { value: "go", label: "Go", supported: false },
  { value: "php", label: "PHP", supported: false },
  { value: "javascript", label: "JavaScript", supported: false },
];

const kotlinSerializationLibraries = [
    { value: "kotlinx", label: "kotlinx" },
    { value: "none", label: "None" },
    { value: "manual", label: "Manual" },
    { value: "gson", label: "Gson" },
    { value: "moshi", label: "Moshi" },
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

const initialDartOptions: DartGeneratorOptions = {
    fromJson: true,
    toJson: true,
    copyWith: false,
    toString: false,
    nullableFields: true,
    requiredFields: false,
    finalFields: true,
    defaultValues: false,
    supportDateTime: true,
    camelCaseFields: true,
    useValuesAsDefaults: false,
};

const initialKotlinOptions: KotlinGeneratorOptions = {
  useVal: true,
  nullable: true,
  dataClass: true,
  defaultValues: false,
  serializationLibrary: "kotlinx",
  defaultToNull: false,
};


type DartOptionKey = keyof DartGeneratorOptions;
type KotlinOptionKey = Exclude<keyof KotlinGeneratorOptions, 'serializationLibrary'>;


const FilterButton = ({ onClick, checked, label, disabled }: { onClick: () => void, checked: boolean, label: string, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
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
  const [dartOptions, setDartOptions] = useState<DartGeneratorOptions>(initialDartOptions);
  const [kotlinOptions, setKotlinOptions] = useState<KotlinGeneratorOptions>(initialKotlinOptions);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const hasEmptyKeys = (obj: any): boolean => {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (hasEmptyKeys(item)) return true;
      }
    } else {
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (key === '') return true;
        if (hasEmptyKeys(obj[key])) return true;
      }
    }
    return false;
  };

  const validateJson = (value: string) => {
    if (!value.trim()) {
        setJsonError(null);
        return;
    }
    try {
      const parsedJson = JSON.parse(value);
       if (Object.keys(parsedJson).length === 0) {
        setJsonError("JSON object cannot be empty.");
        return;
      }
      if (hasEmptyKeys(parsedJson)) {
        setJsonError("JSON cannot contain empty keys.");
      } else {
        setJsonError(null);
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonInput]);

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonInput(newValue);
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
      generateCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dartOptions, kotlinOptions, rootClassName, selectedLanguage]);


  useEffect(() => {
    setRenameInputValue(rootClassName);
  }, [rootClassName]);

  const generateCode = () => {
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
      let result = '';
      if (selectedLanguage === "dart") {
        result = generateDartCode(parsedJson, rootClassName, dartOptions);
      } else if (selectedLanguage === "kotlin") {
        result = generateKotlinCode(parsedJson, rootClassName, kotlinOptions);
      } else {
        toast({
          title: "Not Implemented",
          description: `Code generation for ${
            languages.find((l) => l.value === selectedLanguage)?.label
          } is not yet supported.`,
        });
        setOutputCode("");
        setIsGenerating(false);
        return;
      }
      
      setOutputCode(result);
        
      if (result && !hasGenerated) {
          toast({
              title: "Model Generated",
              description: `Your root model is named "${rootClassName}". You can rename it.`,
              action: (
                  <ToastAction altText="Rename" onClick={() => setIsRenameDialogOpen(true)}>
                      Rename
                  </ToastAction>
              ),
          });
      }

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Generating Model",
        description: errorMessage,
      });
      setOutputCode("");
    } finally {
      setIsGenerating(false);
      if (!hasGenerated && !jsonError) {
        setHasGenerated(true);
      }
    }
  };
  
  const handleToggleDartOption = (option: DartOptionKey) => {
    setDartOptions(prev => {
        const newOptions = { ...prev, [option]: !prev[option] };

        if (option === 'useValuesAsDefaults' && newOptions.useValuesAsDefaults) {
            newOptions.defaultValues = true;
        }

        if (option === 'defaultValues' && !newOptions.defaultValues) {
            newOptions.useValuesAsDefaults = false;
        }
        
        if (option === 'requiredFields' && newOptions.requiredFields) {
            newOptions.nullableFields = true;
        }

        return newOptions;
    });
  };

  const handleToggleKotlinOption = (option: KotlinOptionKey) => {
    setKotlinOptions(prev => {
        const newOptions = { ...prev, [option]: !prev[option] };

        if (option === 'defaultValues' && newOptions.defaultValues) {
            newOptions.defaultToNull = false;
        }
        if (option === 'defaultToNull' && newOptions.defaultToNull) {
            newOptions.defaultValues = false;
        }

        return newOptions;
    });
  };
  
  const handleGenerate = () => {
    generateCode();
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

  const handleFormatJson = () => {
    if (!jsonInput) return;
    try {
      const parsedJson = JSON.parse(jsonInput);
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      setJsonInput(formattedJson);
      validateJson(formattedJson);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "The JSON could not be formatted. Please correct any syntax errors.",
      });
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
           <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
           <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full pl-10">
              <SelectValue placeholder="Select language..." />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} disabled={!lang.supported}>
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
      <Card className="max-w-2xl mx-auto shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={dartOptions.fromJson} onClick={() => handleToggleDartOption('fromJson')} label="fromJson" />
                <FilterButton checked={dartOptions.toJson} onClick={() => handleToggleDartOption('toJson')} label="toJson" />
                <FilterButton checked={dartOptions.copyWith} onClick={() => handleToggleDartOption('copyWith')} label="copyWith" />
                <FilterButton checked={dartOptions.toString} onClick={() => handleToggleDartOption('toString')} label="toString" />
                <FilterButton checked={dartOptions.nullableFields} onClick={() => handleToggleDartOption('nullableFields')} label="nullable" />
                <FilterButton checked={dartOptions.requiredFields} onClick={() => handleToggleDartOption('requiredFields')} label="required" />
                <FilterButton checked={dartOptions.finalFields} onClick={() => handleToggleDartOption('finalFields')} label="final" />
                <FilterButton checked={dartOptions.defaultValues} onClick={() => handleToggleDartOption('defaultValues')} label="default values" />
                <FilterButton checked={dartOptions.useValuesAsDefaults} onClick={() => handleToggleDartOption('useValuesAsDefaults')} label="use values as defaults" />
                <FilterButton checked={dartOptions.supportDateTime} onClick={() => handleToggleDartOption('supportDateTime')} label="support DateTime" />
                <FilterButton checked={dartOptions.camelCaseFields} onClick={() => handleToggleDartOption('camelCaseFields')} label="camelCase" />
          </div>
        </CardContent>
      </Card>
      )}

      {selectedLanguage === 'kotlin' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <FilterButton checked={kotlinOptions.useVal} onClick={() => handleToggleKotlinOption('useVal')} label="val" />
                    <FilterButton checked={kotlinOptions.nullable} onClick={() => handleToggleKotlinOption('nullable')} label="nullable" />
                    <FilterButton checked={kotlinOptions.dataClass} onClick={() => handleToggleKotlinOption('dataClass')} label="data class" />
                    <FilterButton checked={kotlinOptions.defaultValues} onClick={() => handleToggleKotlinOption('defaultValues')} label="default values" />
                    <FilterButton checked={kotlinOptions.defaultToNull} onClick={() => handleToggleKotlinOption('defaultToNull')} label="default to null" />
                </div>
                 <div className="flex items-center justify-center gap-2 pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Serialization Library:</span>
                    <Select 
                        value={kotlinOptions.serializationLibrary} 
                        onValueChange={(value) => setKotlinOptions(prev => ({...prev, serializationLibrary: value as any}))}
                    >
                        <SelectTrigger className="w-auto">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {kotlinSerializationLibraries.map((lib) => (
                            <SelectItem key={lib.value} value={lib.value}>
                                {lib.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 </div>
            </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="shadow-lg flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-2xl">JSON Input</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFormatJson} disabled={!jsonInput || !!jsonError}>
                <Wand2 className="mr-2 h-4 w-4" />
                Format
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="flex-grow h-full">
                <Textarea
                    value={jsonInput}
                    onChange={handleJsonInputChange}
                    placeholder="Paste your JSON here"
                    className={cn("font-code h-[500px] resize-none", {
                        "border-destructive ring-destructive ring-2": jsonError,
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
             <div className="relative flex-grow border rounded-md bg-card font-code text-sm overflow-hidden h-[500px]">
              {isGenerating ? (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
              ) : outputCode ? (
                <div className="relative h-full w-full overflow-auto">
                    <pre className="p-4 h-full">
                        <code>{outputCode}</code>
                    </pre>
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

    
    