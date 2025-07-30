

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
            generateStruct(structName, value, structs);
        }
        return structName;
    }
    return 'serde_json::Value'; // Fallback for any other type, like 'undefined'
}

function generateStruct(structName: string, jsonObject: Record<string, any>, structs: Map<string, string>): void {
    if (structs.has(structName)) return;

    let structString = `#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]\npub struct ${structName} {\n`;
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
        structString += `    pub ${field.name}: Option<${field.type}>,\n\n`;
    }
    
    if (fields.length > 0) {
        structString = structString.slice(0, -1); // Remove last newline
    }

    structString += '}\n';

    structs.set(structName, structString);

    // Recursively generate for sub-objects
    for (const key of sortedKeys) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateStruct(singularKey, value[0], structs);
            } else if (!Array.isArray(value)) {
                generateStruct(toPascalCase(key), value, structs);
            }
        }
    }
}

export function generateRustCode(
    json: any,
    rootStructName: string = 'DataModel'
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const structs = new Map<string, string>();
    const finalRootStructName = toPascalCase(rootStructName);

    generateStruct(finalRootStructName, { ...json }, structs);
    
    const orderedStructs = Array.from(structs.keys()).reverse();

    let finalCode = 'use serde::{Serialize, Deserialize};\n';
    const allCode = orderedStructs.map(name => structs.get(name)).join('\n');

    if (allCode.includes('serde_json::Value')) {
        finalCode += 'use serde_json;\n'
    }

    finalCode += `\n${allCode}`;

    return finalCode;
}
