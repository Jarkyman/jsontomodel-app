
export interface SwiftGeneratorOptions {
    isCodable: boolean;
    useStruct: boolean;
    isEquatable: boolean;
    isHashable: boolean;
    generateCodingKeys: boolean;
    generateCustomInit: boolean;
    generateSampleData: boolean;
    isPublished: boolean;
    isMainActor: boolean;
    isCustomStringConvertible: boolean;
    dateStrategy: 'none' | 'iso8601' | 'formatted';
}

const defaultOptions: SwiftGeneratorOptions = {
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
    dateStrategy: 'none'
};

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

function getSwiftType(value: any, key: string, classes: Map<string, string>, options: SwiftGeneratorOptions): string {
    if (options.dateStrategy !== 'none' && isIsoDateString(value)) return 'Date';

    if (value === null) return 'Any';

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Int' : 'Double';
    if (type === 'boolean') return 'Bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return '[Any]';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getSwiftType(value[0], singularKey, classes, options);
        return `[${listType}]`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return className;
    }
    return 'Any';
}

function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: SwiftGeneratorOptions): void {
    if (classes.has(className)) return;

    const protocols: string[] = [];
    if (options.isCodable) protocols.push('Codable');

    const typeDeclaration = options.useStruct ? 'struct' : 'class';
    let classString = `import Foundation\n\n`;
    classString += `${typeDeclaration} ${className}: ${protocols.join(', ')} {\n`;

    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const swiftType = getSwiftType(jsonObject[key], key, classes, options);
        
        const isOptional = true; // Always optional for now as per spec
        const optionalMarker = isOptional ? '?' : '';
        
        classString += `    let ${fieldName}: ${swiftType}${optionalMarker}\n`;
        fields.push({ name: fieldName, type: swiftType, originalKey: key, value: jsonObject[key] });
    }

    if (options.isCodable && options.generateCodingKeys) {
        const codingKeyFields = fields.filter(f => f.name !== f.originalKey);
        if (codingKeyFields.length > 0) {
            classString += `\n    enum CodingKeys: String, CodingKey {\n`;
            for (const field of codingKeyFields) {
                classString += `        case ${field.name} = "${field.originalKey}"\n`;
            }
            classString += `    }\n`;
        }
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

export function generateSwiftCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: SwiftGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const rootJson = {...json};
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, rootJson, classes, options);

    function findJsonForClass(className: string, currentJson: any, currentName: string): any {
        if (toPascalCase(currentName) === className) {
            return currentJson;
        }

        if (typeof currentJson === 'object' && currentJson !== null) {
            for (const key in currentJson) {
                const pascalKey = toPascalCase(key);
                if (pascalKey === className) {
                    if (Array.isArray(currentJson[key])) {
                        return currentJson[key][0] ?? {};
                    }
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
    
    const orderedClasses = Array.from(classes.keys()).reverse();
    const finalClasses = new Map<string, string>();

    for (const className of orderedClasses) {
        const jsonSource = findJsonForClass(className, rootJson, finalRootClassName);
        if (jsonSource) {
            generateClass(className, jsonSource, finalClasses, options);
        }
    }

    const generatedClassNames = Array.from(finalClasses.keys());
    const rootClassIndex = generatedClassNames.findIndex(name => name === finalRootClassName);
    
    if (rootClassIndex > -1) {
        const [rootClassName] = generatedClassNames.splice(rootClassIndex, 1);
        generatedClassNames.unshift(rootClassName);
    }
    
    return generatedClassNames.map(name => finalClasses.get(name)).join('\n');
}
