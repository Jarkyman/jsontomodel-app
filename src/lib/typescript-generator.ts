

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

function getTypescriptType(value: any, key: string, types: Set<string>, options: TypeScriptGeneratorOptions): string {
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
                
                if (options.allowNulls && !listType.includes(' | null')) {
                     baseType = `(${listType} | null)[]`;
                } else if (listType.includes(' | null')) {
                     baseType = `(${listType})[]`;
                }
                else {
                     baseType = `${listType}[]`;
                }
            }
        } else if (type === 'object') {
            const typeName = toPascalCase(key);
            types.add(typeName);
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


function generateType(typeName: string, jsonObject: Record<string, any>, options: TypeScriptGeneratorOptions): { typeDef: string, dependentTypes: Set<string> } {
    const dependentTypes = new Set<string>();

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
        const tsType = getTypescriptType(jsonObject[key], key, dependentTypes, options);
        fields.push({ name: fieldName, type: tsType });
    }

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

    return { typeDef: typeString, dependentTypes };
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
    const toProcess: { name: string, json: any }[] = [{ name: toPascalCase(rootTypeName), json }];
    const processed = new Set<string>();

    while (toProcess.length > 0) {
        const { name, json: currentJson } = toProcess.shift()!;
        if (processed.has(name)) continue;

        const { typeDef, dependentTypes } = generateType(name, currentJson, options);
        types.set(name, typeDef);
        processed.add(name);

        dependentTypes.forEach(depName => {
            const depJson = findJsonForClass(depName, json, toPascalCase(rootTypeName));
            if (depJson) {
                toProcess.push({ name: depName, json: depJson });
            }
        });
    }
    
    const orderedTypes = Array.from(types.keys()).reverse();

    const finalCode = orderedTypes.map(name => types.get(name)).join('\n');

    return finalCode;
}
