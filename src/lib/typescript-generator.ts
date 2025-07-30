
export interface TypeScriptGeneratorOptions {
    useType: boolean;
    optionalFields: boolean;
    readonlyFields: boolean;
}

const defaultOptions: TypeScriptGeneratorOptions = {
    useType: true,
    optionalFields: true,
    readonlyFields: true,
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

function getTypescriptType(value: any, key: string, types: Map<string, string>, options: TypeScriptGeneratorOptions): string {
    if (value === null) return 'null';
    if (isIsoDateString(value)) return 'Date | string';

    const type = typeof value;
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getTypescriptType(value[0], singularKey, types, options);
        return `${listType}[]`;
    }
    if (type === 'object') {
        const typeName = toPascalCase(key);
        if (!types.has(typeName)) {
            generateType(typeName, value, types, options);
        }
        return typeName;
    }
    return 'any';
}


function generateType(typeName: string, jsonObject: Record<string, any>, types: Map<string, string>, options: TypeScriptGeneratorOptions): void {
    if (types.has(typeName)) return;

    const keyword = options.useType ? 'type' : 'interface';
    let typeString = `export ${keyword} ${typeName} = {\n`;
    if (!options.useType) {
        typeString = `export ${keyword} ${typeName} {\n`;
    }


    const fields: { name: string, type: string }[] = [];

    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const tsType = getTypescriptType(jsonObject[key], key, types, options);
        fields.push({ name: fieldName, type: tsType });
    }

    for (const field of fields) {
        const readonly = options.readonlyFields ? 'readonly ' : '';
        const optional = options.optionalFields ? '?' : '';
        typeString += `    ${readonly}${field.name}${optional}: ${field.type};\n`;
    }

    typeString += '}';
    if (options.useType) {
      typeString += ';\n'
    } else {
      typeString += '\n'
    }


    types.set(typeName, typeString);

    // Recursively generate for sub-objects
    for (const key in jsonObject) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null && !isIsoDateString(value)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateType(singularKey, value[0], types, options);
            } else if (!Array.isArray(value)) {
                generateType(toPascalCase(key), value, types, options);
            }
        }
    }
}


export function generateTypescriptCode(
    json: any,
    rootTypeName: string = 'DataModel',
    options: TypeScriptGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const types = new Map<string, string>();
    const finalRootTypeName = toPascalCase(rootTypeName);

    generateType(finalRootTypeName, { ...json }, types, options);
    
    const orderedTypes = Array.from(types.keys()).reverse();

    const finalCode = orderedTypes.map(name => types.get(name)).join('\n');

    return finalCode;
}

    