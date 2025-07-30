

export interface VbNetGeneratorOptions {
    moduleName: string;
    jsonAnnotations: boolean;
    pascalCase: boolean;
}

const defaultOptions: VbNetGeneratorOptions = {
    moduleName: "DataModels",
    jsonAnnotations: true,
    pascalCase: true,
};

function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getVbNetType(value: any, key: string, classes: Map<string, string>, options: VbNetGeneratorOptions): string {
    if (value === null) return 'Object';
    if (isIsoDateString(value)) return 'Date?';

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Integer?' : 'Double?';
    if (type === 'boolean') return 'Boolean?';
    if (Array.isArray(value)) {
        const listType = value.length > 0 ? getVbNetType(value[0], key.endsWith('s') ? key.slice(0, -1) : key, classes, options) : 'Object';
        const strippedType = listType.endsWith('?') ? listType.slice(0, -1) : listType;
        return `List(Of ${strippedType})`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return className;
    }
    return 'Object';
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: VbNetGeneratorOptions): void {
    if (classes.has(className)) return;

    let classString = `Public Class ${className}\n`;

    const fields: { name: string, type: string, originalKey: string }[] = [];

    for (const key in jsonObject) {
        if (key === '') continue;
        const propertyName = options.pascalCase ? toPascalCase(key) : key;
        const vbNetType = getVbNetType(jsonObject[key], key, classes, options);
        fields.push({ name: propertyName, type: vbNetType, originalKey: key });
    }

    for (const field of fields) {
        // Only add JsonProperty if annotations are on AND the property name is different from the original JSON key.
        if (options.jsonAnnotations && field.originalKey !== field.name) {
            classString += `    <JsonProperty("${field.originalKey}")>\n`;
        }
        classString += `    Public Property ${field.name} As ${field.type}\n\n`;
    }
    
    if (fields.length > 0) {
        classString = classString.slice(0, -1);
    }

    classString += 'End Class';

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


export function generateVbNetCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: VbNetGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, { ...json }, classes, options);
    
    const orderedClasses = Array.from(classes.keys()).reverse();
    let allCode = orderedClasses.map(name => classes.get(name) || '').join('\n\n');

    let finalCode = '';
    const needsNewtonsoft = options.jsonAnnotations && Array.from(classes.values()).some(code => code.includes('<JsonProperty'));
    
    if (needsNewtonsoft) {
        finalCode += `Imports Newtonsoft.Json\n`;
    }
    if (allCode.includes('List(Of')) {
        finalCode += `Imports System.Collections.Generic\n`;
    }

    finalCode += `\nPublic Module ${options.moduleName}\n\n`;
    
    const indentedClasses = allCode.split('\n').map(line => line ? `    ${line}` : '').join('\n');
    
    finalCode += indentedClasses;
    
    finalCode += `\n\nEnd Module\n`;

    return finalCode;
}
