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
        const listType = getDartType(value[0], key.endsWith('s') ? key.slice(0, -1) : key, classes, options);
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

function getDefaultValue(dartType: string): string {
    if (dartType.startsWith('List')) return '[]';
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
    let classString = `class ${className} {\n`;
    const constructorParams: string[] = [];
    const fields: { name: string, type: string, originalKey: string }[] = [];

    // Fields
    for (const key in jsonObject) {
        const fieldName = options.camelCaseFields ? toCamelCase(key) : key;
        const dartType = getDartType(jsonObject[key], key, classes, options);
        const nullable = options.nullableFields ? '?' : '';
        const final = options.finalFields ? 'final ' : '';
        classString += `  ${final}${dartType}${nullable} ${fieldName};\n`;
        fields.push({ name: fieldName, type: dartType, originalKey: key });
        if (options.requiredFields) {
            constructorParams.push(`required this.${fieldName}`);
        } else {
            constructorParams.push(`this.${fieldName}`);
        }
    }
    classString += `\n`;

    // Constructor
    classString += `  ${className}({\n    ${constructorParams.join(',\n    ')},\n  });\n\n`;
    
    // fromJson factory
    if (options.fromJson) {
        classString += `  factory ${className}.fromJson(Map<String, dynamic> json) {\n`;
        classString += `    return ${className}(\n`;
        for (const field of fields) {
            const jsonKey = field.originalKey;
            const fieldName = field.name;
            const value = jsonObject[jsonKey];
            const dartType = field.type;

            let parsingLogic: string;

            if (options.supportDateTime && dartType === 'DateTime') {
                if (options.defaultValues) {
                     parsingLogic = `json['${jsonKey}'] != null ? DateTime.parse(json['${jsonKey}']) : DateTime.now()`;
                } else {
                    parsingLogic = `json['${jsonKey}'] != null ? DateTime.tryParse(json['${jsonKey}']) : null`;
                }
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const itemClassName = getDartType(value[0], jsonKey, classes, options);
                parsingLogic = `json['${jsonKey}'] != null ? List<${itemClassName}>.from(json['${jsonKey}'].map((x) => ${itemClassName}.fromJson(x))) : null`;
            } else if (Array.isArray(value)) {
                const listType = value.length > 0 ? getDartType(value[0], jsonKey, new Map(), options) : 'dynamic';
                parsingLogic = `json['${jsonKey}'] != null ? List<${listType}>.from(json['${jsonKey}']) : null`;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const nestedClassName = toPascalCase(jsonKey);
                parsingLogic = `json['${jsonKey}'] != null ? ${nestedClassName}.fromJson(json['${jsonKey}']) : null`;
            } else {
                 let parseSuffix = '';
                if (dartType === 'double') parseSuffix = '?.toDouble()';
                
                if (options.defaultValues) {
                    parsingLogic = `json['${jsonKey}']${parseSuffix} ?? ${getDefaultValue(dartType)}`;
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
            const value = jsonObject[jsonKey];

            let serializingLogic = fieldName;
            if (options.supportDateTime && field.type === 'DateTime') {
                serializingLogic = `${fieldName}${options.nullableFields ? '?' : ''}.toIso8601String()`;
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                serializingLogic = `${fieldName}?.map((x) => x.toJson()).toList()`;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                serializingLogic = `${fieldName}?.toJson()`;
            }

            classString += `      '${jsonKey}': ${serializingLogic},\n`;
        }
        classString += `    };\n  }\n\n`;
    }
    
    // toString method
    if(options.toString) {
        const toStringFields = fields.map(f => `${f.name}: $${f.name}`).join(', ');
        classString += `  @override\n`;
        classString += `  String toString() {\n`;
        classString += `    return '${className}(${toStringFields})';\n`;
        classString += `  }\n\n`;
    }

    // copyWith method
    if (options.copyWith) {
        classString += `  ${className} copyWith({\n`;
        for (const field of fields) {
            classString += `    ${field.type}? ${field.name},\n`;
        }
        classString += `  }) {\n`;
        classString += `    return ${className}(\n`;
        for (const field of fields) {
            classString += `      ${field.name}: ${field.name} ?? this.${field.name},\n`;
        }
        classString += `    );\n  }\n\n`;
    }


    classString += '}\n';
    classes.set(className, classString);
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
    generateClass(rootClassName, json, classes, options);

    return Array.from(classes.values()).join('\n');
}
