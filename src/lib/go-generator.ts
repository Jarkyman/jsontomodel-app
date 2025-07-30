
export interface GoGeneratorOptions {
    usePointers: boolean;
    packageName: string;
    useArrayOfPointers: boolean;
}

const defaultOptions: GoGeneratorOptions = {
    usePointers: true,
    packageName: 'main',
    useArrayOfPointers: false,
};

function toPascalCase(str: string): string {
    const pascal = str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
    // Handle specific acronyms common in Go
    return pascal.replace(/\b(Id|Url|Api|Json|Html|Http|Https)\b/g, (match) => match.toUpperCase());
}

function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getGoType(value: any, key: string, structs: Map<string, string>, options: GoGeneratorOptions): string {
    let goType: string;
    
    if (isIsoDateString(value)) {
        goType = 'time.Time';
    } else if (value === null) {
        goType = 'interface{}'; // The equivalent of 'any'
    } else {
        const type = typeof value;
        if (type === 'string') {
            goType = 'string';
        } else if (type === 'number') {
            goType = value % 1 === 0 ? 'int' : 'float64';
        } else if (type === 'boolean') {
            goType = 'bool';
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                goType = '[]interface{}';
            } else {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                // Recursively get the type for the slice element. The pointer logic is handled outside this block.
                let sliceType = getGoType(value[0], singularKey, structs, options);

                // If useArrayOfPointers is true, make the element type a pointer, unless it's already a pointer or interface
                if (options.useArrayOfPointers && !sliceType.startsWith('*') && sliceType !== 'interface{}') {
                    sliceType = `*${sliceType}`;
                }

                goType = `[]${sliceType}`;
            }
        } else if (type === 'object') {
            const structName = toPascalCase(key);
            if (!structs.has(structName)) {
                generateStruct(structName, value, structs, options);
            }
            goType = structName;
        } else {
            goType = 'interface{}';
        }
    }
    
    // Use pointers for non-slice/map/interface types to handle nullability at the field level.
    if (options.usePointers && !goType.startsWith('[]') && !goType.startsWith('map[') && goType !== 'interface{}') {
        // If the type is already a pointer (from array logic), don't double-pointer it.
        if (!goType.startsWith('*')) {
            return `*${goType}`;
        }
    }

    return goType;
}

function generateStruct(structName: string, jsonObject: Record<string, any>, structs: Map<string, string>, options: GoGeneratorOptions): void {
    if (structs.has(structName)) return;

    let structString = `type ${structName} struct {\n`;
    const fields: { name: string, type: string, originalKey: string }[] = [];

    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toPascalCase(key);
        const goType = getGoType(jsonObject[key], key, structs, options);
        fields.push({ name: fieldName, type: goType, originalKey: key });
    }

    for (const field of fields) {
        structString += `\t${field.name} ${field.type} \`json:"${field.originalKey},omitempty"\`\n`;
    }
    structString += '}\n';

    structs.set(structName, structString);

    // Recursively generate for sub-objects
    for (const key of sortedKeys) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null && !isIsoDateString(value)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateStruct(singularKey, value[0], structs, options);
            } else if (!Array.isArray(value)) {
                generateStruct(toPascalCase(key), value, structs, options);
            }
        }
    }
}

export function generateGoCode(
    json: any,
    rootStructName: string = 'DataModel',
    options: GoGeneratorOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const structs = new Map<string, string>();
    const finalRootStructName = toPascalCase(rootStructName);

    generateStruct(finalRootStructName, { ...json }, structs, options);
    
    const orderedStructs = Array.from(structs.keys()).reverse();

    let finalCode = `package ${options.packageName}\n\n`;
    let allCode = orderedStructs.map(name => structs.get(name)).join('\n');

    // Add time import if necessary
    if (allCode.includes('time.Time')) {
        finalCode += 'import "time"\n\n';
    }

    finalCode += allCode;

    return finalCode;
}
