
export interface TypeScriptGeneratorOptions {
    useType: boolean;
    optionalFields: boolean;
    readonlyFields: boolean;
    allowNulls: boolean;
}

const defaultOptions: TypeScriptGeneratorOptions = {
    useType: true,
    optionalFields: true,
    readonlyFields: true,
    allowNulls: false,
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
    let baseType: string;

    if (value === null) {
        baseType = 'any';
    } else if (isIsoDateString(value)) {
        baseType = 'Date | string';
    } else {
        const type = typeof value;
        if (type === 'string') {
            baseType = 'string';
        } else if (type === 'number') {
            baseType = 'number';
        } else if (type === 'boolean') {
            baseType = 'boolean';
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                baseType = 'any[]';
            } else {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                let listType = getTypescriptType(value[0], singularKey, types, options);
                
                if (options.allowNulls && !listType.includes('| null')) {
                     baseType = `(${listType} | null)[]`;
                } else {
                     baseType = `${listType}[]`;
                }
            }
        } else if (type === 'object') {
            const typeName = toPascalCase(key);
            if (!types.has(typeName)) {
                generateType(typeName, value, types, options);
            }
            baseType = typeName;
        } else {
            baseType = 'any';
        }
    }

    if (options.allowNulls && baseType !== 'any' && !baseType.endsWith(' | null') && !baseType.endsWith(')[]')) {
        return `${baseType} | null`;
    }
    
    if (options.allowNulls && baseType.endsWith('[]') && !baseType.endsWith(')[]')) {
       return `${baseType} | null`;
    }

    return baseType;
}


function generateType(typeName: string, jsonObject: Record<string, any>, types: Map<string, string>, options: TypeScriptGeneratorOptions): void {
    if (types.has(typeName)) return;

    const keyword = options.useType ? 'type' : 'interface';
    let typeString = `export ${keyword} ${typeName} = {\n`;
    if (!options.useType) {
        typeString = `export ${keyword} ${typeName} {\n`;
    }


    const fields: { name: string, type: string }[] = [];
    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const tsType = getTypescriptType(jsonObject[key], key, types, options);
        fields.push({ name: fieldName, type: tsType });
    }

    // Sort fields alphabetically by name
    fields.sort((a, b) => a.name.localeCompare(b.name));

    for (const field of fields) {
        const readonly = options.readonlyFields ? 'readonly ' : '';
        const optional = options.optionalFields ? '?' : '';
        let finalType = field.type;
        typeString += `    ${readonly}${field.name}${optional}: ${finalType};\n`;
    }

    typeString += '}';
    if (options.useType) {
      typeString += ';\n'
    } else {
      typeString += '\n'
    }


    types.set(typeName, typeString);

    // Recursively generate for sub-objects
    sortedKeys.forEach(key => {
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
    });
}


export function generateTypescriptCode(
    json: any,
    rootTypeName: string = 'DataModel',
    options: TypeScriptGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        const keyword = options.useType ? 'type' : 'interface';
        const emptyDef = `export ${keyword} ${toPascalCase(rootTypeName)} = {}`;
        return options.useType ? `${emptyDef};` : emptyDef;
    }
    
    const types = new Map<string, string>();
    const finalRootTypeName = toPascalCase(rootTypeName);

    generateType(finalRootTypeName, { ...json }, types, options);
    
    const orderedTypes = Array.from(types.keys()).reverse();

    const finalCode = orderedTypes.map(name => types.get(name)).join('\n');

    return finalCode;
}
