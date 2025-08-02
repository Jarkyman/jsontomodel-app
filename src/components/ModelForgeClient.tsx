
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
import { generateRustCode, RustGeneratorOptions } from "@/lib/rust-generator";
import { generateRubyCode, RubyGeneratorOptions } from "@/lib/ruby-generator";
import { generateRCode, RGeneratorOptions } from "@/lib/r-generator";
import { generateObjCCode, ObjCGeneratorOptions } from "@/lib/objc-generator";
import { generateSQLSchema, SQLGeneratorOptions } from "@/lib/sql-generator";
import { generateElixirCode, ElixirGeneratorOptions } from "@/lib/elixir-generator";
import { generateErlangCode, ErlangGeneratorOptions } from "@/lib/erlang-generator";
import { generateScaleCode, ScaleGeneratorOptions } from "@/lib/scala-generator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import AdPlaceholder from "./AdPlaceholder";
import { Separator } from "./ui/separator";

const languages = [
  { value: "typescript", label: "TypeScript", supported: true },
  { value: "dart", label: "Flutter (Dart)", supported: true },
  { value: "kotlin", label: "Kotlin", supported: true },
  { value: "swift", label: "Swift", supported: true },
  { value: "python", label: "Python", supported: true },
  { value: "java", label: "Java", supported: true },
  { value: "csharp", label: "C#", supported: true },
  { value: "go", label: "Go", supported: true },
  { value: "php", label: "PHP", supported: true },
  { value: "javascript", label: "JavaScript", supported: true },
  { value: "cpp", label: "C++", supported: true },
  { value: "vbnet", label: "Visual Basic", supported: true },
  { value: "rust", label: "Rust", supported: true },
  { value: "ruby", label: "Ruby", supported: true },
  { value: "r", label: "R", supported: true },
  { value: "objectivec", label: "Objective-C", supported: true },
  { value: "sql", label: "SQL", supported: true },
  { value: "elixir", label: "Elixir", supported: true },
  { value: "erlang", label: "Erlang", supported: true },
  { value: "scala", label: "Scala", supported: true },
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

const initialRustOptions: RustGeneratorOptions = {
    deriveClone: true,
    publicFields: true,
    useSerdeDefault: true,
};

const initialRubyOptions: RubyGeneratorOptions = {
  attrAccessor: true,
  snakeCase: true,
  initialize: true,
  defaultValues: false,
  useStruct: false,
};

const initialROptions: RGeneratorOptions = {
  useStruct: true, // Ignored, but kept for parity
  defaultValues: false,
};

const initialObjcOptions: ObjCGeneratorOptions = {
  properties: true,
  initializers: true,
  nullability: true,
  toCamelCase: true,
  rootClassPrefix: "",
};

const initialSqlOptions: SQLGeneratorOptions = {
  tablePrefix: '',
  useSnakeCase: true,
  includePrimaryKey: true,
  useNotNull: true,
  includeTimestamps: false,
  useForeignKeys: true,
  useTypeInference: true,
  defaultValues: false,
};

const initialElixirOptions: ElixirGeneratorOptions = {
  useSnakeCase: true,
  includeTypes: true,
  defaultValues: false,
  includeStruct: true,
};

const initialErlangOptions: ErlangGeneratorOptions = {
  useSnakeCase: true,
  includeTypes: true,
  includeDefaults: false,
};

const initialScalaOptions: ScaleGeneratorOptions = {
  useSnakeCase: true,
  includeTypes: true,
  defaultValues: false,
  includeStruct: true,
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
type CppOptionKey = Exclude<keyof CppGeneratorOptions, 'cppVersion'>;
type VbNetOptionKey = keyof VbNetGeneratorOptions;
type RustOptionKey = keyof RustGeneratorOptions;
type RubyOptionKey = keyof RubyGeneratorOptions;
type ROptionKey = keyof RGeneratorOptions;
type SqlOptionKey = keyof Omit<SQLGeneratorOptions, 'tablePrefix'>;
type ElixirOptionKey = keyof ElixirGeneratorOptions;
type ErlangOptionKey = keyof ErlangGeneratorOptions;
type ScalaOptionKey = keyof ScaleGeneratorOptions;
type ObjcOptionKey = keyof Omit<ObjCGeneratorOptions, 'rootClassPrefix' | 'toCamelCase'>;


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
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [outputCode, setOutputCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem("selectedLanguage");
      return storedLang || "typescript";
    }
    return "typescript";
  });
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
  const [rustOptions, setRustOptions] = useState<RustGeneratorOptions>(initialRustOptions);
  const [rubyOptions, setRubyOptions] = useState<RubyGeneratorOptions>(initialRubyOptions);
  const [rOptions, setROptions] = useState<RGeneratorOptions>(initialROptions);
  const [objcOptions, setObjcOptions] = useState<ObjCGeneratorOptions>(initialObjcOptions);
  const [sqlOptions, setSqlOptions] = useState<SQLGeneratorOptions>(initialSqlOptions);
  const [elixirOptions, setElixirOptions] = useState<ElixirGeneratorOptions>(initialElixirOptions);
  const [erlangOptions, setErlangOptions] = useState<ErlangGeneratorOptions>(initialErlangOptions);
  const [scalaOptions, setScalaOptions] = useState<ScaleGeneratorOptions>(initialScalaOptions);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
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
    validateJson(newValue);
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }
  };
  
  const generateCode = () => {
    if (!jsonInput.trim()) {
      setOutputCode("");
      return;
    }
    if (jsonError) {
      setOutputCode("");
      return;
    }
    const isValid = validateJson(jsonInput);
    if (!isValid) {
      setOutputCode("");
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
      setOutputCode("");
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
          } else if (selectedLanguage === "rust") {
              result = generateRustCode(parsedJson, rootClassName, rustOptions);
          } else if (selectedLanguage === "ruby") {
              result = generateRubyCode(parsedJson, rootClassName, rubyOptions);
          } else if (selectedLanguage === "r") {
            result = generateRCode(parsedJson, rootClassName, rOptions);
          } else if (selectedLanguage === "objectivec") {
            result = generateObjCCode(parsedJson, rootClassName, objcOptions);
          } else if (selectedLanguage === "sql") {
            const finalSqlOptions: SQLGeneratorOptions = {
                ...sqlOptions,
                tablePrefix: sqlOptions.tablePrefix ? `${sqlOptions.tablePrefix}_` : '',
            };
            result = generateSQLSchema(parsedJson, rootClassName, finalSqlOptions);
          } else if (selectedLanguage === "elixir") {
            result = generateElixirCode(parsedJson, rootClassName, elixirOptions);
          } else if (selectedLanguage === "erlang") {
            result = generateErlangCode(parsedJson, rootClassName, erlangOptions);
          } else if (selectedLanguage === "scala") {
            result = generateScaleCode(parsedJson, rootClassName, scalaOptions);
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
            
          if (result && !hasGenerated && userHasInteracted) {
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
    }, 50); // A small delay for UI to update
  };

  useEffect(() => {
    const storedJson = localStorage.getItem("jsonInput");
    const initialJson = storedJson || defaultJson;
    setJsonInput(initialJson);
    validateJson(initialJson);
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedLanguage", selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (userHasInteracted) {
      localStorage.setItem("jsonInput", jsonInput);
    }
  }, [jsonInput, userHasInteracted]);

  useEffect(() => {
    setRenameInputValue(rootClassName);
  }, [rootClassName]);

  useEffect(() => {
    generateCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jsonInput,
    selectedLanguage,
    rootClassName,
    dartOptions,
    kotlinOptions,
    swiftOptions,
    pythonOptions,
    javaOptions,
    csharpOptions,
    typescriptOptions,
    goOptions,
    phpOptions,
    javascriptOptions,
    cppOptions,
    vbnetOptions,
    rustOptions,
    rubyOptions,
    rOptions,
    objcOptions,
    sqlOptions,
    elixirOptions,
    erlangOptions,
    scalaOptions,
  ]);

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
            // When switching to C++03, legacy pointers are necessary.
            // When switching away, std::optional is preferred.
            newOptions.usePointersForNull = value === '03';
        }
        return newOptions;
    });
  };
  
  const handleToggleVbNetOption = (option: VbNetOptionKey) => {
    setVbnetOptions(prev => ({...prev, [option]: !prev[option] }));
  };
  
  const handleToggleRustOption = (option: RustOptionKey) => {
    setRustOptions(prev => ({...prev, [option]: !prev[option] }));
  };

  const handleToggleRubyOption = (option: RubyOptionKey) => {
    setRubyOptions(prev => ({...prev, [option]: !prev[option] }));
  };

  const handleToggleROption = (option: ROptionKey) => {
    setROptions(prev => ({...prev, [option]: !prev[option] }));
  };

  const handleObjcOption = (option: keyof ObjCGeneratorOptions, value: any) => {
    setObjcOptions(prev => ({ ...prev, [option]: value }));
  };
  
  const handleToggleObjcOption = (option: ObjcOptionKey) => {
     setObjcOptions(prev => ({ ...prev, [option]: !prev[option] }));
  }

  const handleToggleCamelCaseObjcOption = () => {
    setObjcOptions(prev => ({...prev, toCamelCase: !prev.toCamelCase}));
  }

  const handleSqlOption = (option: keyof SQLGeneratorOptions, value: any) => {
    setSqlOptions(prev => ({ ...prev, [option]: value }));
  };
  
  const handleToggleSqlOption = (option: SqlOptionKey) => {
    setSqlOptions(prev => ({...prev, [option]: !prev[option] }));
  };

  const handleToggleElixirOption = (option: ElixirOptionKey) => {
    setElixirOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleToggleErlangOption = (option: ErlangOptionKey) => {
    setErlangOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleToggleScalaOption = (option: ScalaOptionKey) => {
    setScalaOptions(prev => ({ ...prev, [option]: !prev[option] }));
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
          Use our free <strong>JSON to Model</strong> converter to instantly generate type-safe <strong>data models</strong> in popular languages like <strong>Swift</strong>, <strong>Kotlin</strong>, <strong>Dart</strong>, <strong>TypeScript</strong>, <strong>Python</strong>, <strong>Rust</strong>, and more. Whether you’re building mobile or backend apps, this <strong>code generator</strong> will save you time and ensure consistency.
        </p>
      </header>

      <section aria-labelledby="language-selection" className="mx-auto flex w-full max-w-sm items-center gap-4">
        <h2 id="language-selection" className="sr-only">Language Selection</h2>
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
      </section>

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
              <div className="flex items-center justify-center gap-2 pt-4">
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

      {selectedLanguage === 'rust' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <FilterButton 
                checked={rustOptions.deriveClone} 
                onClick={() => handleToggleRustOption('deriveClone')} 
                label="Derive Clone/PartialEq"
              />
              <FilterButton 
                checked={rustOptions.publicFields} 
                onClick={() => handleToggleRustOption('publicFields')} 
                label="Public Fields"
              />
              <FilterButton
                checked={rustOptions.useSerdeDefault}
                onClick={() => handleToggleRustOption('useSerdeDefault')}
                label="Use `#[serde(default)]`"
               />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLanguage === 'ruby' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <FilterButton 
                checked={rubyOptions.attrAccessor} 
                onClick={() => handleToggleRubyOption('attrAccessor')} 
                label="attr_accessor"
              />
              <FilterButton 
                checked={rubyOptions.snakeCase} 
                onClick={() => handleToggleRubyOption('snakeCase')} 
                label="snake_case"
              />
              <FilterButton
                checked={rubyOptions.initialize}
                onClick={() => handleToggleRubyOption('initialize')}
                label="initialize"
               />
               <FilterButton
                checked={rubyOptions.defaultValues}
                onClick={() => handleToggleRubyOption('defaultValues')}
                label="Default Values"
               />
               <FilterButton
                checked={rubyOptions.useStruct}
                onClick={() => handleToggleRubyOption('useStruct')}
                label="Use Struct"
               />
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedLanguage === 'r' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <FilterButton 
                checked={rOptions.defaultValues} 
                onClick={() => handleToggleROption('defaultValues')} 
                label="Default Values"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLanguage === 'objectivec' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={objcOptions.properties} onClick={() => handleToggleObjcOption('properties')} label="property" />
                <FilterButton checked={objcOptions.initializers} onClick={() => handleToggleObjcOption('initializers')} label="Initializer" />
                <FilterButton checked={objcOptions.nullability} onClick={() => handleToggleObjcOption('nullability')} label="Nullability" />
                <FilterButton checked={objcOptions.toCamelCase} onClick={() => handleToggleCamelCaseObjcOption()} label="camelCase" />
              </div>
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Class Prefix:</span>
                    <Input 
                      value={objcOptions.rootClassPrefix}
                      onChange={(e) => handleObjcOption('rootClassPrefix', e.target.value)}
                      placeholder="e.g. DM"
                      className="w-24"
                    />
                 </div>
          </CardContent>
        </Card>
      )}

      {selectedLanguage === 'sql' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={sqlOptions.useSnakeCase ?? false} onClick={() => handleToggleSqlOption('useSnakeCase')} label="snake_case" />
                <FilterButton checked={sqlOptions.includePrimaryKey ?? false} onClick={() => handleToggleSqlOption('includePrimaryKey')} label="Primary Key" />
                <FilterButton checked={sqlOptions.useNotNull ?? false} onClick={() => handleToggleSqlOption('useNotNull')} label="NOT NULL" />
                <FilterButton checked={sqlOptions.useForeignKeys ?? false} onClick={() => handleToggleSqlOption('useForeignKeys')} label="Foreign Keys" />
                <FilterButton checked={sqlOptions.includeTimestamps ?? false} onClick={() => handleToggleSqlOption('includeTimestamps')} label="Timestamps" />
                <FilterButton checked={sqlOptions.useTypeInference ?? false} onClick={() => handleToggleSqlOption('useTypeInference')} label="Infer Types" />
                <FilterButton checked={sqlOptions.defaultValues ?? false} onClick={() => handleToggleSqlOption('defaultValues')} label="Default Values" />
              </div>
               <div className="flex items-center justify-center gap-2 pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Table Prefix:</span>
                    <Input 
                      value={sqlOptions.tablePrefix}
                      onChange={(e) => handleSqlOption('tablePrefix', e.target.value)}
                      placeholder="e.g. tbl"
                      className="w-24"
                    />
                 </div>
          </CardContent>
        </Card>
      )}
      
      {selectedLanguage === 'elixir' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={elixirOptions.useSnakeCase ?? true} onClick={() => handleToggleElixirOption('useSnakeCase')} label="snake_case" />
                <FilterButton checked={elixirOptions.includeTypes ?? true} onClick={() => handleToggleElixirOption('includeTypes')} label="@types" />
                <FilterButton checked={elixirOptions.includeStruct ?? true} onClick={() => handleToggleElixirOption('includeStruct')} label="defstruct" />
                <FilterButton checked={elixirOptions.defaultValues ?? true} onClick={() => handleToggleElixirOption('defaultValues')} label="Default Comments" />
              </div>
          </CardContent>
        </Card>
      )}

      {selectedLanguage === 'erlang' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={erlangOptions.useSnakeCase ?? true} onClick={() => handleToggleErlangOption('useSnakeCase')} label="snake_case" />
                <FilterButton checked={erlangOptions.includeTypes ?? true} onClick={() => handleToggleErlangOption('includeTypes')} label="-type" />
                <FilterButton checked={erlangOptions.includeDefaults ?? true} onClick={() => handleToggleErlangOption('includeDefaults')} label="Defaults" />
              </div>
          </CardContent>
        </Card>
      )}

      {selectedLanguage === 'scala' && (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <FilterButton checked={scalaOptions.useSnakeCase ?? true} onClick={() => handleToggleScalaOption('useSnakeCase')} label="snake_case" />
                <FilterButton checked={scalaOptions.includeTypes ?? true} onClick={() => handleToggleScalaOption('includeTypes')} label="Types" />
                <FilterButton checked={scalaOptions.defaultValues ?? true} onClick={() => handleToggleScalaOption('defaultValues')} label="Defaults" />
                <FilterButton checked={scalaOptions.includeStruct ?? true} onClick={() => handleToggleScalaOption('includeStruct')} label="Case Class" />
              </div>
          </CardContent>
        </Card>
      )}

      <AdPlaceholder 
        className="max-w-2xl w-full mx-auto" 
        adClient="ca-pub-9894760850635221" 
        adSlot="3849241862" 
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-labelledby="io-panels-title">
        <h2 id="io-panels-title" className="sr-only">JSON Input and Generated Model Output</h2>
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
                    aria-label="JSON Input Area"
                    aria-invalid={!!jsonError}
                    aria-describedby={jsonError ? "json-error-message" : undefined}
                />
            </div>
             {jsonError && (
              <p id="json-error-message" className="mt-2 flex items-center text-sm text-destructive">
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
                  <p>{jsonError ? 'Fix the JSON error to generate code' : 'Your model will be generated live here.'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <AdPlaceholder 
        className="w-full"
        adClient="ca-pub-9894760850635221" 
        adSlot="3992378950" 
      />

       <section className="mx-auto max-w-4xl py-8">
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
  );
}


    

    