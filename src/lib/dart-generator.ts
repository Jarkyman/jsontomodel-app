

export interface DartGeneratorOptions {
    finalFields: boolean;
    nullableFields: boolean;
    requiredFields: boolean;
    copyWith: boolean;
    toString: boolean;
    toJson: boolean;
    fromJson: boolean;
    defaultValues: boolean;
    supportDateTime: boolean;
    camelCaseFields: boolean;
    useValuesAsDefaults: boolean;
}

const defaultOptions: DartGeneratorOptions = {
    finalFields: true,
    nullableFields: true,
    requiredFields: false,
    copyWith: false,
    toString: false,
    toJson: true,
    fromJson: true,
    defaultValues: false,
    supportDateTime: true,
    camelCaseFields: false,
    useValuesAsDefaults: false,
};


// Utility functions
function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function toCamelCase(str: string): string {
    let s = str.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
    return s.charAt(0).toLowerCase() + s.slice(1);
}

function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getDartType(value: any, key: string, classes: Map<string, string>, options: DartGeneratorOptions): string {
    if (options.supportDateTime && isIsoDateString(value)) return 'DateTime';
    
    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'int' : 'double';
    if (type === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'List<dynamic>';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getDartType(value[0], singularKey, classes, options);
        return `List<${listType}>`;
    }
    if (type === 'object' && value !== null) {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return className;
    }
    return 'dynamic';
}

function getDefaultValue(dartType: string, value: any, options: DartGeneratorOptions): string {
    if (options.useValuesAsDefaults) {
        if (value === null) return 'null';
        if (dartType === 'String') return `'${value.toString().replace(/'/g, "\\'")}'`;
        if (dartType === 'DateTime') return `DateTime.parse('${value}')`;
        if (Array.isArray(value)) return 'const []';
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) return `${dartType}()`;
        if (value !== null) return value.toString();
        return 'null';
    }

    if (dartType === 'dynamic') return 'null';
    if (dartType.startsWith('List')) return 'const []';
    switch (dartType) {
        case 'String': return "''";
        case 'int': return '0';
        case 'double': return '0.0';
        case 'bool': return 'false';
        case 'DateTime': return 'DateTime.now()';
        default: return `${dartType}()`;
    }
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: DartGeneratorOptions): void {
    if (classes.has(className)) return;

    let classString = `class ${className} {\n`;
    const constructorParams: string[] = [];
    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];

    // Fields
    for (const key in jsonObject) {
        if (key === '') continue; // Skip empty keys
        const fieldName = options.camelCaseFields ? toCamelCase(key) : key;
        const dartType = getDartType(jsonObject[key], key, classes, options);
        const nullable = options.nullableFields ? '?' : '';
        const final = options.finalFields ? 'final ' : '';
        classString += `  ${final}${dartType}${nullable} ${fieldName};\n`;
        fields.push({ name: fieldName, type: dartType, originalKey: key, value: jsonObject[key] });
    }
    if (fields.length > 0) {
      classString += `\n`;
    }

    // Constructor
    if (fields.length > 0) {
        classString += `  ${className}({\n`;
        for (const field of fields) {
            if (options.requiredFields) {
                constructorParams.push(`    required this.${field.name}`);
            } else {
                constructorParams.push(`    this.${field.name}`);
            }
        }
        classString += `${constructorParams.join(',\n')},\n  });\n\n`;
    } else {
        classString += `  ${className}();\n\n`;
    }
    
    // fromJson factory
    if (options.fromJson) {
        classString += `  factory ${className}.fromJson(Map<String, dynamic> json) {\n`;
        classString += `    return ${className}(\n`;
        for (const field of fields) {
            const jsonKey = field.originalKey;
            const fieldName = field.name;
            const value = field.value;
            const dartType = field.type;

            let parsingLogic: string;

            if (options.supportDateTime && dartType === 'DateTime') {
                if (options.defaultValues) {
                     parsingLogic = `json['${jsonKey}'] != null ? DateTime.parse(json['${jsonKey}']) : ${getDefaultValue(dartType, value, options)}`;
                } else {
                    parsingLogic = `json['${jsonKey}'] != null ? DateTime.tryParse(json['${jsonKey}']) : null`;
                }
            } else if (dartType.startsWith('List<') && dartType.endsWith('>')) {
                const listType = dartType.substring(5, dartType.length - 1);
                if (listType === 'dynamic') {
                     parsingLogic = `json['${jsonKey}'] != null ? List<dynamic>.from(json['${jsonKey}']) : ${options.defaultValues ? 'const []' : 'null'}`;
                }
                 else if (listType === 'String' || listType === 'int' || listType === 'double' || listType === 'bool') {
                     parsingLogic = `json['${jsonKey}'] != null ? List<${listType}>.from(json['${jsonKey}']) : ${options.defaultValues ? 'const []' : 'null'}`;
                 }
                else {
                    parsingLogic = `json['${jsonKey}'] != null ? List<${listType}>.from(json['${jsonKey}'].map((x) => ${listType}.fromJson(x))) : ${options.defaultValues ? 'const []' : 'null'}`;
                }
            } else if (classes.has(dartType)) {
                 if (options.defaultValues) {
                    parsingLogic = `json['${jsonKey}'] != null ? ${dartType}.fromJson(json['${jsonKey}']) : ${getDefaultValue(dartType, value, options)}`;
                 } else {
                    parsingLogic = `json['${jsonKey}'] != null ? ${dartType}.fromJson(json['${jsonKey}']) : null`;
                 }
            } else {
                 let parseSuffix = '';
                if (dartType === 'double' && !options.useValuesAsDefaults) parseSuffix = '?.toDouble()';
                
                if (options.defaultValues) {
                    parsingLogic = `json['${jsonKey}']${parseSuffix} ?? ${getDefaultValue(dartType, value, options)}`;
                } else {
                    parsingLogic = `json['${jsonKey}']${parseSuffix}`;
                }
            }
            classString += `      ${fieldName}: ${parsingLogic},\n`;
        }
        classString += `    );\n  }\n\n`;
    }

    // toJson method
    if (options.toJson) {
        classString += `  Map<String, dynamic> toJson() {\n`;
        classString += `    return {\n`;
        for (const field of fields) {
            const jsonKey = field.originalKey;
            const fieldName = field.name;
            const dartType = field.type;

            let serializingLogic = fieldName;
            if (options.supportDateTime && dartType === 'DateTime') {
                serializingLogic = `${fieldName}${options.nullableFields ? '?' : ''}.toIso8601String()`;
            } else if (dartType.startsWith('List<') && dartType.endsWith('>') && dartType !== 'List<dynamic>') {
                const listType = dartType.substring(5, dartType.length - 1);
                 if (classes.has(listType)) {
                    serializingLogic = `${fieldName}?.map((x) => x.toJson()).toList()`;
                 }
            } else if (classes.has(dartType)) {
                serializingLogic = `${fieldName}?.toJson()`;
            }

            classString += `      '${jsonKey}': ${serializingLogic},\n`;
        }
        classString += `    };\n  }\n`;
    }
    
    // toString method
    if(options.toString) {
        if (options.toJson) classString += `\n`;
        classString += `  @override\n`;
        classString += `  String toString() {\n`;
        if (fields.length > 0) {
            const toStringFields = fields.map(f => `${f.name}: $${f.name}`).join(', ');
            classString += `    return '${className}(${toStringFields})';\n`;
        } else {
            classString += `    return '${className}()';\n`;
        }
        classString += `  }\n`;
    }

    // copyWith method
    if (options.copyWith) {
        if (options.toJson || options.toString) classString += `\n`;
        classString += `  ${className} copyWith({\n`;
        for (const field of fields) {
            classString += `    ${field.type}? ${field.name},\n`;
        }
        classString += `  }) {\n`;
        if (fields.length > 0) {
            classString += `    return ${className}(\n`;
            for (const field of fields) {
                classString += `      ${field.name}: ${field.name} ?? this.${field.name},\n`;
            }
            classString += `    );\n`;
        } else {
            classString += `    return ${className}();\n`;
        }
        classString += `  }\n`;
    }

    // Add newline if any method was generated
    if(options.toJson || options.toString || options.copyWith) {
        classString += `\n`;
    }

    classString += '}\n';
    classes.set(className, classString);

     // Recursively generate for sub-objects
    for (const key in jsonObject) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                 const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                 generateClass(singularKey, value[0], classes, options);
            } else if (!Array.isArray(value)) {
                generateClass(toPascalCase(key), value, classes, options);
            }
        }
    }
}


export function generateDartCode(
    json: any, 
    rootClassName: string = 'DataModel', 
    options: DartGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null) {
        throw new Error("Invalid JSON object provided.");
    }
    
    // Ensure required and nullable are not both true
    if(options.requiredFields) {
        options.nullableFields = false;
    }

    const classes = new Map<string, string>();
    const classOrder: string[] = [];

    const originalGenerateClass = (className: string, jsonObject: Record<string, any>, classesMap: Map<string, string>, opts: DartGeneratorOptions) => {
        generateClass(className, jsonObject, classesMap, opts);
        if (!classOrder.includes(className)) {
            classOrder.push(className);
        }
    };
    
    const rootJson = {...json};
    const finalRootClassName = toPascalCase(rootClassName);

    originalGenerateClass(finalRootClassName, rootJson, classes, options);

    // This is a bit of a hack to ensure dependencies are generated before they are used.
    // We reverse the order of generation because deeper classes are added to the list last.
    const orderedClasses = Array.from(classes.keys()).reverse();
    const finalClasses = new Map<string, string>();

    for (const className of orderedClasses) {
        const jsonSource = findJsonForClass(className, rootJson, finalRootClassName);
        if (jsonSource) {
            generateClass(className, jsonSource, finalClasses, options);
        }
    }

    // A helper to find the original JSON object for a given class name
    function findJsonForClass(className: string, currentJson: any, currentName: string): any {
        if (toPascalCase(currentName) === className) {
            return currentJson;
        }

        if (typeof currentJson === 'object' && currentJson !== null) {
            for (const key in currentJson) {
                const pascalKey = toPascalCase(key);
                if (pascalKey === className) {
                    return currentJson[key];
                }
                 const singularPascalKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                if (singularPascalKey === className && Array.isArray(currentJson[key]) && currentJson[key].length > 0) {
                    return currentJson[key][0];
                }
                const result = findJsonForClass(className, currentJson[key], key);
                if (result) return result;
            }
        }
        return null;
    }

    const generatedClasses = Array.from(finalClasses.values());
    const rootClass = generatedClasses.pop(); // The root class is the last one generated
    if (rootClass) {
        generatedClasses.unshift(rootClass); // Add it to the beginning
    }

    return generatedClasses.join('\n');
}
