

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
    camelCaseFields: true,
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

function getDartType(value: any, key: string, classes: Set<string>, options: DartGeneratorOptions): string {
    if (options.supportDateTime && isIsoDateString(value)) return 'DateTime';
    if (value === null) return 'dynamic';
    
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
        classes.add(className);
        return className;
    }
    return 'dynamic';
}

function getDefaultValue(dartType: string, value: any, options: DartGeneratorOptions): string {
    if (dartType === 'dynamic') return 'null';
    if (options.useValuesAsDefaults) {
        if (value === null) return 'null';
        if (dartType === 'String') return `'${value.toString().replace(/'/g, "\\'")}'`;
        if (dartType === 'DateTime') return `DateTime.parse('${value}')`;
        if (Array.isArray(value)) return 'const []';
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            // Cannot create const instances if constructor is not const.
             return `${dartType}()`;
        }
        if (value !== null) return value.toString();
        return 'null';
    }

    if (dartType.startsWith('List')) return 'const []';
    switch (dartType) {
        case 'String': return "''";
        case 'int': return '0';
        case 'double': return '0.0';
        case 'bool': return 'false';
        case 'DateTime': return 'DateTime.now()';
        default: 
            // Cannot create const instances if constructor is not const.
            return `${dartType}()`;
    }
}


function generateClass(className: string, jsonObject: Record<string, any>, options: DartGeneratorOptions): { classDef: string, dependentClasses: Set<string> } {
    const dependentClasses = new Set<string>();
    let classString = `class ${className} {\n`;
    const constructorParams: string[] = [];
    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    
    const sortedKeys = Object.keys(jsonObject).sort();

    // Fields
    for (const key of sortedKeys) {
        if (key === '') continue; // Skip empty keys
        const fieldName = options.camelCaseFields ? toCamelCase(key) : key;
        const dartType = getDartType(jsonObject[key], key, dependentClasses, options);
        fields.push({ name: fieldName, type: dartType, originalKey: key, value: jsonObject[key] });
    }
    fields.sort((a, b) => a.name.localeCompare(b.name));

    for (const field of fields) {
        const isNullable = options.nullableFields;
        const nullable = isNullable || field.type === 'dynamic' ? '?' : '';
        const final = options.finalFields ? 'final ' : '';
        classString += `  ${final}${field.type}${nullable} ${field.name};\n`;
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
            } else if (options.defaultValues && !options.nullableFields) {
                 constructorParams.push(`    this.${field.name} = ${getDefaultValue(field.type, field.value, options)}`);
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
        if (Object.keys(jsonObject).length === 0) {
            classString += `    return ${className}();\n  }\n\n`;
        } else {
            classString += `    return ${className}(\n`;
            for (const field of fields) {
                const jsonKey = field.originalKey;
                const fieldName = field.name;
                const value = field.value;
                const dartType = field.type;

                let parsingLogic: string;
                const isNullable = options.nullableFields;

                if (options.supportDateTime && dartType === 'DateTime') {
                    if (options.defaultValues && !isNullable) {
                        parsingLogic = `json['${jsonKey}'] != null ? DateTime.parse(json['${jsonKey}']) : ${getDefaultValue(dartType, value, options)}`;
                    } else {
                        parsingLogic = `json['${jsonKey}'] != null ? DateTime.tryParse(json['${jsonKey}']) : null`;
                    }
                } else if (dartType.startsWith('List<') && dartType.endsWith('>')) {
                    const listType = dartType.substring(5, dartType.length - 1);
                    const defaultList = (options.defaultValues && !isNullable) ? 'const []' : 'null';
                    if (listType === 'dynamic') {
                        parsingLogic = `json['${jsonKey}'] != null ? List<dynamic>.from(json['${jsonKey}']) : ${defaultList}`;
                    } else if (['String', 'int', 'double', 'bool'].includes(listType)) {
                        parsingLogic = `json['${jsonKey}'] != null ? List<${listType}>.from(json['${jsonKey}']) : ${defaultList}`;
                    } else {
                        parsingLogic = `json['${jsonKey}'] != null ? List<${listType}>.from(json['${jsonKey}'].map((x) => ${listType}.fromJson(x))) : ${defaultList}`;
                    }
                } else if (dependentClasses.has(dartType)) {
                    if (options.defaultValues && !isNullable && !options.requiredFields) {
                        parsingLogic = `json['${jsonKey}'] != null ? ${dartType}.fromJson(json['${jsonKey}']) : ${getDefaultValue(dartType, value, options)}`;
                    } else {
                        parsingLogic = `json['${jsonKey}'] != null ? ${dartType}.fromJson(json['${jsonKey}']) : null`;
                    }
                } else {
                    let parseSuffix = '';
                    if (dartType === 'double') parseSuffix = '?.toDouble()';
                    
                    if (options.defaultValues && !isNullable) {
                        parsingLogic = `json['${jsonKey}']${parseSuffix} ?? ${getDefaultValue(dartType, value, options)}`;
                    } else {
                         parsingLogic = `json['${jsonKey}']${parseSuffix}`;
                    }
                }
                classString += `      ${fieldName}: ${parsingLogic},\n`;
            }
            classString += `    );\n  }\n\n`;
        }
    }

    // toJson method
    if (options.toJson) {
        classString += `  Map<String, dynamic> toJson() {\n`;
        if (Object.keys(jsonObject).length === 0) {
            classString += `    return {};\n  }\n`;
        } else {
            classString += `    return {\n`;
            for (const field of fields) {
                const jsonKey = field.originalKey;
                const fieldName = field.name;
                const dartType = field.type;
                const isNullable = options.nullableFields;

                let serializingLogic = fieldName;
                if (options.supportDateTime && dartType === 'DateTime') {
                    serializingLogic = `${fieldName}${isNullable ? '?' : ''}.toIso8601String()`;
                } else if (dartType.startsWith('List<') && dartType.endsWith('>') && dartType !== 'List<dynamic>') {
                    const listType = dartType.substring(5, dartType.length - 1);
                    if (dependentClasses.has(listType)) {
                        serializingLogic = `${fieldName}?.map((x) => x.toJson()).toList()`;
                    }
                } else if (dependentClasses.has(dartType)) {
                    serializingLogic = `${fieldName}?.toJson()`;
                }

                classString += `      '${jsonKey}': ${serializingLogic},\n`;
            }
            classString += `    };\n  }\n`;
        }
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
        if (fields.length > 0) {
            for (const field of fields) {
                const nullable = (field.type === 'dynamic' || options.nullableFields || (options.defaultValues && !options.requiredFields)) ? '?' : '';
                classString += `    ${field.type}${nullable} ${field.name},\n`;
            }
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
    return { classDef: classString, dependentClasses };
}


export function generateDartCode(
    json: any, 
    rootClassName: string = 'DataModel', 
    options: DartGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null) {
        throw new Error("Invalid JSON object provided.");
    }
    
    if (Object.keys(json).length === 0) {
        const emptyOptions = { ...options, requiredFields: false, nullableFields: true, defaultValues: false };
        const { classDef } = generateClass(toPascalCase(rootClassName), {}, emptyOptions);
        // Correctly handle empty copyWith
        return classDef.replace(/copyWith\(\{.*\}\)/s, 'copyWith()');
    }
    
    const classes = new Map<string, string>();
    const toProcess: { name: string, json: any }[] = [{ name: toPascalCase(rootClassName), json }];
    const processed = new Set<string>();

    while (toProcess.length > 0) {
        const { name, json: currentJson } = toProcess.shift()!;
        if (processed.has(name)) continue;

        const { classDef, dependentClasses } = generateClass(name, currentJson, options);
        classes.set(name, classDef);
        processed.add(name);

        dependentClasses.forEach(depName => {
            const depJson = findJsonForClass(depName, json, toPascalCase(rootClassName));
            if (depJson) {
                toProcess.push({ name: depName, json: depJson });
            }
        });
    }

    const orderedClasses = Array.from(classes.keys()).sort((a,b) => {
        if(a === toPascalCase(rootClassName)) return 1;
        if(b === toPascalCase(rootClassName)) return -1;
        return a.localeCompare(b);
    });

    return orderedClasses.map(name => classes.get(name)).join('\n');
}

function findJsonForClass(className: string, currentJson: any, rootName: string): any {
    if (toPascalCase(rootName) === className) {
        return currentJson;
    }

    for (const key in currentJson) {
        const value = currentJson[key];
        const pascalKey = toPascalCase(key);

        if (pascalKey === className && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return value;
        }

        const singularPascalKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        if (singularPascalKey === className && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            return value[0];
        }

        if (typeof value === 'object' && value !== null) {
            const result = findJsonForClass(className, value, key);
            if (result) return result;
        }
    }
    return null;
}
