
export interface CSharpGeneratorOptions {
    namespace: string;
    useRecords: boolean;
    propertySetters: 'init' | 'set';
    jsonAnnotations: boolean;
    listType: 'List<T>' | 'T[]';
}

const defaultOptions: CSharpGeneratorOptions = {
    namespace: "DataModels",
    useRecords: true,
    propertySetters: "init",
    jsonAnnotations: true,
    listType: "List<T>"
};

function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getCSharpType(value: any, key: string, classes: Map<string, string>, options: CSharpGeneratorOptions): string {
    if (value === null) return 'object?';
    if (isIsoDateString(value)) return 'DateTime?';

    const type = typeof value;
    if (type === 'string') return 'string?';
    if (type === 'number') return value % 1 === 0 ? 'int?' : 'double?';
    if (type === 'boolean') return 'bool?';
    if (Array.isArray(value)) {
        const listType = value.length > 0 ? getCSharpType(value[0], key.endsWith('s') ? key.slice(0, -1) : key, classes, options) : 'object?';
        const strippedType = listType.endsWith('?') ? listType.slice(0, -1) : listType;
        if (options.listType === 'List<T>') {
            return `List<${strippedType}>?`;
        }
        return `${strippedType}[]?`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return `${className}?`;
    }
    return 'object?';
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: CSharpGeneratorOptions): void {
    if (classes.has(className)) return;

    const typeDeclaration = options.useRecords ? 'record' : 'class';
    let classString = `public ${typeDeclaration} ${className}\n{\n`;

    const fields: { name: string, type: string, originalKey: string }[] = [];

    for (const key in jsonObject) {
        const propertyName = toPascalCase(key);
        const csharpType = getCSharpType(jsonObject[key], key, classes, options);
        fields.push({ name: propertyName, type: csharpType, originalKey: key });
    }

    for (const field of fields) {
        if (options.jsonAnnotations) {
            classString += `    [JsonPropertyName("${field.originalKey}")]\n`;
        }
        classString += `    public ${field.type} ${field.name} { get; ${options.propertySetters}; }\n\n`;
    }
    
    // Remove last newline
    if (fields.length > 0) {
        classString = classString.slice(0, -1);
    }

    classString += '}\n';

    classes.set(className, classString);

    // Recursively generate for sub-objects
    for (const key in jsonObject) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null && !isIsoDateString(value)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateClass(singularKey, value[0], classes, options);
            } else if (!Array.isArray(value)) {
                generateClass(toPascalCase(key), value, classes, options);
            }
        }
    }
}


export function generateCSharpCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: CSharpGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, { ...json }, classes, options);
    
    const orderedClasses = Array.from(classes.keys()).reverse();

    let finalCode = `using System;\n`;
    finalCode += `using System.Collections.Generic;\n`;
    if (options.jsonAnnotations) {
        finalCode += `using System.Text.Json.Serialization;\n`;
    }
    finalCode += `\n`;
    finalCode += `namespace ${options.namespace}\n{\n`;
    
    const indentedClasses = orderedClasses.map(name => {
        const classCode = classes.get(name) || '';
        return classCode.split('\n').map(line => line ? `    ${line}` : '').join('\n').trimEnd();
    }).join('\n\n');

    finalCode += indentedClasses;

    finalCode += `\n}\n`;

    return finalCode;
}
