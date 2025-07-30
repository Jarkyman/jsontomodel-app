
export interface RustGeneratorOptions {
    deriveClone: boolean;
    publicFields: boolean;
}

const defaultOptions: RustGeneratorOptions = {
    deriveClone: true,
    publicFields: true,
};

function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function toSnakeCase(str: string): string {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
        .toLowerCase();
}

function getRustType(value: any, key: string, structs: Map<string, string>): string {
    if (value === null) {
        return 'serde_json::Value';
    }

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'i64' : 'f64';
    if (type === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'Vec<serde_json::Value>';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getRustType(value[0], singularKey, structs);
        return `Vec<${listType}>`;
    }
    if (type === 'object') {
        const structName = toPascalCase(key);
        if (!structs.has(structName)) {
            // Placeholder, will be generated later
        }
        return structName;
    }
    return 'serde_json::Value';
}

function generateStruct(structName: string, jsonObject: Record<string, any>, structs: Map<string, string>, options: RustGeneratorOptions): void {
    if (structs.has(structName)) return;

    let derives = ['Debug', 'Serialize', 'Deserialize'];
    if (options.deriveClone) {
        derives.splice(1, 0, 'Clone', 'PartialEq');
    }

    let structString = `#[derive(${derives.join(', ')})]\npub struct ${structName} {\n`;
    const fields: { name: string, type: string, originalKey: string }[] = [];

    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toSnakeCase(key);
        const rustType = getRustType(jsonObject[key], key, structs);
        fields.push({ name: fieldName, type: rustType, originalKey: key });
    }

    for (const field of fields) {
        structString += `    #[serde(rename = "${field.originalKey}")]\n`;
        const pubKeyword = options.publicFields ? 'pub ' : '';
        structString += `    ${pubKeyword}${field.name}: Option<${field.type}>,\n\n`;
    }
    
    if (fields.length > 0) {
        structString = structString.slice(0, -1);
    }

    structString += '}\n';

    structs.set(structName, structString);

    // Recursively call for sub-objects
    for (const key of sortedKeys) {
        const value = jsonObject[key];
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateStruct(singularKey, value[0], structs, options);
            } else if (!Array.isArray(value)) {
                generateStruct(toPascalCase(key), value, structs, options);
            }
        }
    }
}

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


export function generateRustCode(
    json: any,
    rootStructName: string = 'DataModel',
    options: RustGeneratorOptions = defaultOptions,
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const initialStructs = new Map<string, string>();
    const finalRootStructName = toPascalCase(rootStructName);

    // Initial pass to discover all struct names
    generateStruct(finalRootStructName, { ...json }, initialStructs, options);
    
    const orderedStructNames = Array.from(initialStructs.keys()).reverse();
    const finalStructs = new Map<string, string>();

    // Second pass to generate with the correct context
    for (const structName of orderedStructNames) {
        const jsonSource = findJsonForClass(structName, json, rootStructName);
        if (jsonSource) {
            generateStruct(structName, jsonSource, finalStructs, options);
        }
    }

    let finalCode = 'use serde::{Serialize, Deserialize};\n';
    const allCode = orderedStructNames.map(name => finalStructs.get(name) || '').join('\n');

    if (allCode.includes('serde_json::Value')) {
        finalCode += 'use serde_json;\n'
    }

    finalCode += `\n${allCode}`;

    return finalCode;
}
