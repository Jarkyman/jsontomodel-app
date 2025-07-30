
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
import { generateSwiftCode, SwiftGeneratorOptions } from "@/lib/swift-generator";
import { generatePythonCode, PythonGeneratorOptions } from "@/lib/python-generator";
import { generateJavaCode, JavaGeneratorOptions } from "@/lib/java-generator";
import { generateCSharpCode, CSharpGeneratorOptions } from "@/lib/csharp-generator";
import { generateTypescriptCode, TypeScriptGeneratorOptions } from "@/lib/typescript-generator";
import { generateGoCode, GoGeneratorOptions } from "@/lib/go-generator";
import { generatePhpCode, PhpGeneratorOptions } from "@/lib/php-generator";
import { generateJavaScriptCode, JavaScriptGeneratorOptions } from "@/lib/javascript-generator";
import { generateCppCode, CppGeneratorOptions } from "@/lib/cpp-generator";
import { generateVbNetCode, VbNetGeneratorOptions } from "@/lib/vbnet-generator";
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
  { value: "swift", label: "Swift", supported: true },
  { value: "python", label: "Python", supported: true },
  { value: "java", label: "Java", supported: true },
  { value: "csharp", label: "C#", supported: true },
  { value: "typescript", label: "TypeScript", supported: true },
  { value: "go", label: "Go", supported: true },
  { value: "php", label: "PHP", supported: true },
  { value: "javascript", label: "JavaScript", supported: true },
  { value: "cpp", label: "C++", supported: true },
  { value: "vbnet", label: "Visual Basic", supported: true },
  { value: "rust", label: "Rust", supported: false },
  { value: "ruby", label: "Ruby", supported: false },
  { value: "r", label: "R", supported: false },
  { value: "objectivec", label: "Objective-C", supported: false },
  { value: "sql", label: "SQL", supported: false },
  { value: "elixir", label: "Elixir", supported: false },
  { value: "erlang", label: "Erlang", supported: false },
  { value: "scala", label: "Scala", supported: false },
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

const initialSwiftOptions: SwiftGeneratorOptions = {
    isCodable: true,
    useStruct: true,
    isEquatable: false,
    isHashable: false,
    generateCodingKeys: true,
    generateCustomInit: false,
    generateSampleData: false,
    isPublished: false,
    isMainActor: false,
    isCustomStringConvertible: false,
    dateStrategy: 'iso8601'
};

const initialPythonOptions: PythonGeneratorOptions = {
    dataclass: true,
    frozen: false,
    slots: false,
    fromDict: true,
    toDict: true,
    typeHints: true,
    defaultValues: false,
    camelCaseToSnakeCase: true,
    includeRepr: true,
    includeEq: true,
    includeHash: false,
    nestedClasses: true,
    sampleInstance: false,
};

const initialJavaOptions: JavaGeneratorOptions = {
    getters: true,
    setters: false,
    constructor: true,
    noArgsConstructor: false,
    builder: true,
    equalsHashCode: true,
    toString: true,
    snakeCase: true,
    nested: true,
    finalFields: true,
    jsonAnnotations: true,
};

const initialCSharpOptions: CSharpGeneratorOptions = {
    namespace: "DataModels",
    useRecords: true,
    propertySetters: "init",
    jsonAnnotations: true,
    listType: "List<T>"
};

const initialTypescriptOptions: TypeScriptGeneratorOptions = {
    useType: true,
    optionalFields: true,
    readonlyFields: true,
    allowNulls: false,
};

const initialGoOptions: GoGeneratorOptions = {
    usePointers: true,
    packageName: 'main',
    useArrayOfPointers: false,
};

const initialPhpOptions: PhpGeneratorOptions = {
    typedProperties: true,
    finalClasses: true,
    readonlyProperties: true,
    constructorPropertyPromotion: true,
    fromArray: true,
    toArray: true,
};

const initialJavascriptOptions: JavaScriptGeneratorOptions = {
  includeJSDoc: true,
  includeFromToJSON: true,
  convertDates: true,
};

const initialCppOptions: CppGeneratorOptions = {
  namespace: "DataModels",
  usePointersForNull: false,
  cppVersion: "17",
};

const initialVbNetOptions: VbNetGeneratorOptions = {
    moduleName: "DataModels",
    jsonAnnotations: true,
};


type DartOptionKey = keyof DartGeneratorOptions;
type KotlinOptionKey = Exclude<keyof KotlinGeneratorOptions, 'serializationLibrary'>;
type SwiftOptionKey = keyof SwiftGeneratorOptions;
type PythonOptionKey = keyof PythonGeneratorOptions;
type JavaOptionKey = keyof JavaGeneratorOptions;
type TypescriptOptionKey = keyof TypeScriptGeneratorOptions;
type GoOptionKey = keyof GoGeneratorOptions;
type PhpOptionKey = keyof PhpGeneratorOptions;
type JavascriptOptionKey = keyof JavaScriptGeneratorOptions;
type CppOptionKey = keyof CppGeneratorOptions;
type VbNetOptionKey = keyof VbNetGeneratorOptions;


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
  const [swiftOptions, setSwiftOptions] = useState<SwiftGeneratorOptions>(initialSwiftOptions);
  const [pythonOptions, setPythonOptions] = useState<PythonGeneratorOptions>(initialPythonOptions);
  const [javaOptions, setJavaOptions] = useState<JavaGeneratorOptions>(initialJavaOptions);
  const [csharpOptions, setCSharpOptions] = useState<CSharpGeneratorOptions>(initialCSharpOptions);
  const [typescriptOptions, setTypescriptOptions] = useState<TypeScriptGeneratorOptions>(initialTypescriptOptions);
  const [goOptions, setGoOptions] = useState<GoGeneratorOptions>(initialGoOptions);
  const [phpOptions, setPhpOptions] = useState<PhpGeneratorOptions>(initialPhpOptions);
  const [javascriptOptions, setJavascriptOptions] = useState<JavaScriptGeneratorOptions>(initialJavascriptOptions);
  const [cppOptions, setCppOptions] = useState<CppGeneratorOptions>(initialCppOptions);
  const [vbnetOptions, setVbnetOptions] = useState<VbNetGeneratorOptions>(initialVbNetOptions);
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
        setOutputCode("");
        return false;
    }
    try {
      const parsedJson = JSON.parse(value);
       if (Object.keys(parsedJson).length === 0) {
        setJsonError("JSON object cannot be empty.");
        setOutputCode("");
        return false;
      }
      if (hasEmptyKeys(parsedJson)) {
        setJsonError("JSON cannot contain empty keys.");
        setOutputCode("");
        return false;
      } else {
        setJsonError(null);
        return true;
      }
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      } else {
        setJsonError("An unknown JSON parsing error occurred.");
      }
      setOutputCode("");
      return false;
    }
  };

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
    setRenameInputValue(rootClassName);
  }, [rootClassName]);

  const generateCode = () => {
    const isValid = validateJson(jsonInput);
    if (!isValid) {
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
    // Setting a timeout to allow the UI to update to the loading state before the potentially blocking code generation runs.
    setTimeout(() => {
        try {
          let result = '';
          if (selectedLanguage === "dart") {
            result = generateDartCode(parsedJson, rootClassName, dartOptions);
          } else if (selectedLanguage === "kotlin") {
            result = generateKotlinCode(parsedJson, rootClassName, kotlinOptions);
          } else if (selectedLanguage === "swift") {
            result = generateSwiftCode(parsedJson, rootClassName, swiftOptions);
          } else if (selectedLanguage === "python") {
            result = generatePythonCode(parsedJson, rootClassName, pythonOptions);
          } else if (selectedLanguage === "java") {
            result = generateJavaCode(parsedJson, rootClassName, javaOptions);
          } else if (selectedLanguage === "csharp") {
            result = generateCSharpCode(parsedJson, rootClassName, csharpOptions);
          } else if (selectedLanguage === "typescript") {
            result = generateTypescriptCode(parsedJson, rootClassName, typescriptOptions);
          } else if (selectedLanguage === "go") {
            result = generateGoCode(parsedJson, rootClassName, goOptions);
          } else if (selectedLanguage === "php") {
            result = generatePhpCode(parsedJson, rootClassName, phpOptions);
          } else if (selectedLanguage === "javascript") {
              result = generateJavaScriptCode(parsedJson, rootClassName, javascriptOptions);
          } else if (selectedLanguage === "cpp") {
              result = generateCppCode(parsedJson, rootClassName, cppOptions);
          } else if (selectedLanguage === "vbnet") {
              result = generateVbNetCode(parsedJson, rootClassName, vbnetOptions);
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
              setHasGenerated(true);
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
        }
    }, 50); // A small delay
  };
  
  // Main useEffect for live generation
  useEffect(() => {
      const handler = setTimeout(() => {
          generateCode();
      }, 500); // Debounce generation

      return () => {
          clearTimeout(handler);
      };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonInput, dartOptions, kotlinOptions, swiftOptions, pythonOptions, javaOptions, csharpOptions, typescriptOptions, goOptions, phpOptions, javascriptOptions, cppOptions, vbnetOptions, rootClassName, selectedLanguage]);


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

  const handleToggleSwiftOption = (option: SwiftOptionKey) => {
    setSwiftOptions(prev => ({...prev, [option]: !prev[option] }));
  };
  
  const handleTogglePythonOption = (option: PythonOptionKey) => {
    setPythonOptions(prev => {
        const newOptions = { ...prev, [option]: !prev[option] };

        if (option === 'frozen' && newOptions.frozen) {
            // Uncheck slots if frozen is checked, as it's a common conflict
            // newOptions.slots = false;
        }
        return newOptions;
    });
  };

  const handleToggleJavaOption = (option: JavaOptionKey) => {
    setJavaOptions(prev => {
        const newOptions = { ...prev, [option]: !prev[option] };
        if (option === 'finalFields' && newOptions.finalFields) {
            newOptions.setters = false; // Cannot have setters for final fields
        }
         if (option === 'noArgsConstructor' && newOptions.finalFields && newOptions.noArgsConstructor) {
            // No-arg constructor is not useful with final fields unless there are no fields.
            // Let's not enforce this automatically for now, but it's a consideration.
        }
        return newOptions;
    });
  };
  
  const handleCSharpOption = (option: keyof CSharpGeneratorOptions, value: any) => {
    setCSharpOptions(prev => ({ ...prev, [option]: value }));
  };
  
  const handleToggleTypescriptOption = (option: TypescriptOptionKey) => {
    setTypescriptOptions(prev => ({...prev, [option]: !prev[option] }));
  };

  const handleToggleGoOption = (option: GoOptionKey) => {
    setGoOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleTogglePhpOption = (option: PhpOptionKey) => {
    setPhpOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };
  
  const handleToggleJavascriptOption = (option: JavascriptOptionKey) => {
    setJavascriptOptions(prev => ({...prev, [option]: !prev[option] }));
  };

  const handleCppOption = (option: keyof CppGeneratorOptions, value: any) => {
    setCppOptions(prev => {
        const newOptions = { ...prev, [option]: value };
        if (option === 'cppVersion') {
            newOptions.usePointersForNull = value === '03';
        }
        return newOptions;
    });
  };
  
  const handleToggleVbNetOption = (option: VbNetOptionKey) => {
    setVbnetOptions(prev => ({...prev, [option]: !prev[option] }));
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
          Instantly generate data models for over 20 languages from any JSON structure. Select your language and forge your code.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-sm items-center gap-4">
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

      {selectedLanguage === 'swift' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <FilterButton checked={swiftOptions.isCodable} onClick={() => handleToggleSwiftOption('isCodable')} label="Codable" />
                    <FilterButton checked={swiftOptions.useStruct} onClick={() => handleToggleSwiftOption('useStruct')} label="struct" />
                    <FilterButton checked={!swiftOptions.useStruct} onClick={() => handleToggleSwiftOption('useStruct')} label="class" />
                    <FilterButton checked={swiftOptions.isEquatable} onClick={() => handleToggleSwiftOption('isEquatable')} label="Equatable" />
                    <FilterButton checked={swiftOptions.isHashable} onClick={() => handleToggleSwiftOption('isHashable')} label="Hashable" />
                    <FilterButton checked={swiftOptions.isCustomStringConvertible} onClick={() => handleToggleSwiftOption('isCustomStringConvertible')} label="Debug Description" />
                    <FilterButton checked={swiftOptions.generateSampleData} onClick={() => handleToggleSwiftOption('generateSampleData')} label="Sample Data" />
                    <FilterButton checked={swiftOptions.isPublished} onClick={() => handleToggleSwiftOption('isPublished')} label="@Published" />
                    <FilterButton checked={swiftOptions.isMainActor} onClick={() => handleToggleSwiftOption('isMainActor')} label="@MainActor" />
                </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'python' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <FilterButton checked={pythonOptions.fromDict} onClick={() => handleTogglePythonOption('fromDict')} label="from_dict" />
                    <FilterButton checked={pythonOptions.toDict} onClick={() => handleTogglePythonOption('toDict')} label="to_dict" />
                    <FilterButton checked={pythonOptions.frozen} onClick={() => handleTogglePythonOption('frozen')} label="frozen" />
                    <FilterButton checked={pythonOptions.slots} onClick={() => handleTogglePythonOption('slots')} label="slots" />
                    <FilterButton checked={pythonOptions.camelCaseToSnakeCase} onClick={() => handleTogglePythonOption('camelCaseToSnakeCase')} label="snake_case" />
                    <FilterButton checked={pythonOptions.nestedClasses} onClick={() => handleTogglePythonOption('nestedClasses')} label="nested" />
                </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'java' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <FilterButton checked={javaOptions.getters} onClick={() => handleToggleJavaOption('getters')} label="Getters" />
                  <FilterButton checked={javaOptions.setters} onClick={() => handleToggleJavaOption('setters')} label="Setters" disabled={javaOptions.finalFields} />
                  <FilterButton checked={javaOptions.constructor} onClick={() => handleToggleJavaOption('constructor')} label="All-Args Constructor" />
                  <FilterButton checked={javaOptions.noArgsConstructor} onClick={() => handleToggleJavaOption('noArgsConstructor')} label="No-Args Constructor" />
                  <FilterButton checked={javaOptions.builder} onClick={() => handleToggleJavaOption('builder')} label="Builder" />
                  <FilterButton checked={javaOptions.equalsHashCode} onClick={() => handleToggleJavaOption('equalsHashCode')} label="equals() & hashCode()" />
                  <FilterButton checked={javaOptions.toString} onClick={() => handleToggleJavaOption('toString')} label="toString()" />
                  <FilterButton checked={javaOptions.finalFields} onClick={() => handleToggleJavaOption('finalFields')} label="Final Fields" />
                  <FilterButton checked={javaOptions.jsonAnnotations} onClick={() => handleToggleJavaOption('jsonAnnotations')} label="@JsonProperty" />
                  <FilterButton checked={javaOptions.snakeCase} onClick={() => handleToggleJavaOption('snakeCase')} label="camelCase Fields" />
                </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'csharp' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <FilterButton checked={csharpOptions.useRecords} onClick={() => handleCSharpOption('useRecords', !csharpOptions.useRecords)} label="Use Records" />
                    <FilterButton checked={!csharpOptions.useRecords} onClick={() => handleCSharpOption('useRecords', !csharpOptions.useRecords)} label="Use Classes" />
                    <FilterButton checked={csharpOptions.propertySetters === 'init'} onClick={() => handleCSharpOption('propertySetters', 'init')} label="Immutable (init)" />
                    <FilterButton checked={csharpOptions.propertySetters === 'set'} onClick={() => handleCSharpOption('propertySetters', 'set')} label="Mutable (set)" />
                    <FilterButton checked={csharpOptions.jsonAnnotations} onClick={() => handleCSharpOption('jsonAnnotations', !csharpOptions.jsonAnnotations)} label="[JsonPropertyName]" />
                </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'typescript' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <FilterButton checked={typescriptOptions.useType} onClick={() => handleToggleTypescriptOption('useType')} label="Use `type`" />
                  <FilterButton checked={!typescriptOptions.useType} onClick={() => handleToggleTypescriptOption('useType')} label="Use `interface`" />
                  <FilterButton checked={typescriptOptions.optionalFields} onClick={() => handleToggleTypescriptOption('optionalFields')} label="Optional Fields" />
                  <FilterButton checked={typescriptOptions.readonlyFields} onClick={() => handleToggleTypescriptOption('readonlyFields')} label="Readonly Fields" />
                  <FilterButton checked={typescriptOptions.allowNulls} onClick={() => handleToggleTypescriptOption('allowNulls')} label="Allow Nulls" />
                </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'go' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={goOptions.usePointers} onClick={() => handleToggleGoOption('usePointers')} label="Use Pointers (for nulls)" />
                <FilterButton checked={goOptions.useArrayOfPointers} onClick={() => handleToggleGoOption('useArrayOfPointers')} label="Use Pointers in Arrays" />
              </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'php' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={phpOptions.constructorPropertyPromotion} onClick={() => handleTogglePhpOption('constructorPropertyPromotion')} label="Property Promotion" />
                <FilterButton checked={phpOptions.readonlyProperties} onClick={() => handleTogglePhpOption('readonlyProperties')} label="Readonly Properties" />
                <FilterButton checked={phpOptions.finalClasses} onClick={() => handleTogglePhpOption('finalClasses')} label="Final Classes" />
                <FilterButton checked={phpOptions.typedProperties} onClick={() => handleTogglePhpOption('typedProperties')} label="Typed Properties" />
                <FilterButton checked={phpOptions.fromArray} onClick={() => handleTogglePhpOption('fromArray')} label="fromArray()" />
                <FilterButton checked={phpOptions.toArray} onClick={() => handleTogglePhpOption('toArray')} label="toArray()" />
              </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'javascript' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={javascriptOptions.includeJSDoc} onClick={() => handleToggleJavascriptOption('includeJSDoc')} label="JSDoc Comments" />
                <FilterButton checked={javascriptOptions.includeFromToJSON} onClick={() => handleToggleJavascriptOption('includeFromToJSON')} label="from/toJSON Methods" />
                <FilterButton checked={javascriptOptions.convertDates} onClick={() => handleToggleJavascriptOption('convertDates')} label="Parse Dates" />
              </div>
            </CardContent>
        </Card>
      )}

      {selectedLanguage === 'cpp' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">C++ Standard:</span>
                  <Select 
                      value={cppOptions.cppVersion} 
                      onValueChange={(value) => handleCppOption('cppVersion', value as '17' | '20' | '03')}
                  >
                      <SelectTrigger className="w-auto">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="17">C++17</SelectItem>
                          <SelectItem value="20">C++20</SelectItem>
                          <SelectItem value="03">C++03</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </CardContent>
      </Card>
      )}

      {selectedLanguage === 'vbnet' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <FilterButton 
                checked={vbnetOptions.jsonAnnotations} 
                onClick={() => handleToggleVbNetOption('jsonAnnotations')} 
                label="[JsonProperty]"
              />
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
                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                  <p>{jsonError ? 'Fix the JSON error to generate code' : 'Your generated model will appear here.'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
