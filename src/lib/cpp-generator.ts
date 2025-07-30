
export interface CppGeneratorOptions {
    namespace: string;
    usePointersForNull: boolean;
    cppVersion: '17' | '20';
}

const defaultOptions: CppGeneratorOptions = {
    namespace: "DataModels",
    usePointersForNull: false, // std::optional is preferred
    cppVersion: '17'
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

function getCppType(value: any, key: string, structs: Set<string>, options: CppGeneratorOptions): string {
    if (value === null) {
        // We will use std::optional for nullability, so we need a base type.
        // nlohmann::json can handle json::value_t::null, so we can infer from sibling items if it's an array
        // For a standalone null, it's ambiguous. 'auto' isn't a type. Let's default to a common case or require user input.
        // For now, let's treat it as a generic json object, which nlohmann can handle.
        return 'nlohmann::json';
    }

    const type = typeof value;
    if (type === 'string') return 'std::string';
    if (type === 'number') return value % 1 === 0 ? 'int' : 'double';
    if (type === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'std::vector<nlohmann::json>';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getCppType(value[0], singularKey, structs, options);
        return `std::vector<${listType}>`;
    }
    if (type === 'object') {
        const structName = toPascalCase(key);
        structs.add(structName);
        return structName;
    }
    return 'nlohmann::json'; // Fallback for any other type
}


function generateStruct(structName: string, jsonObject: Record<string, any>, structs: Set<string>, options: CppGeneratorOptions): { structDef: string, conversionDef: string } {
    let structDef = `struct ${structName} {\n`;
    let conversionDef = `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(${structName}`;

    const fields: { name: string, type: string, originalKey: string }[] = [];
    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toSnakeCase(key);
        const cppType = getCppType(jsonObject[key], key, structs, options);
        
        // C++17 std::optional is the modern way to handle optional/nullable fields
        const finalType = `std::optional<${cppType}>`;
        
        structDef += `    ${finalType} ${fieldName};\n`;
        fields.push({ name: fieldName, type: cppType, originalKey: key });
    }
    structDef += '};\n';
    
    // Add fields to NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE
    for(const field of fields) {
        conversionDef += `, ${field.name}`;
    }
    conversionDef += ');\n';


    // Recursively generate for sub-objects that were identified
    for (const key of sortedKeys) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                 const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                 generateStruct(singularKey, value[0], structs, options);
            } else if (!Array.isArray(value)) {
                generateStruct(toPascalCase(key), value, structs, options);
            }
        }
    }

    return { structDef, conversionDef };
}


function collectAllStructs(json: any, rootStructName: string, options: CppGeneratorOptions): Map<string, { structDef: string, conversionDef: string }> {
    const allStructs = new Map<string, { structDef: string, conversionDef: string }>();
    const structsToProcess = new Set<string>();

    function process(structName: string, currentJson: any) {
        if (allStructs.has(structName)) {
            return;
        }

        const identifiedSubStructs = new Set<string>();
        const { structDef, conversionDef } = generateStruct(structName, currentJson, identifiedSubStructs, options);
        allStructs.set(structName, { structDef, conversionDef });

        for (const subStructName of identifiedSubStructs) {
            const subJson = findJsonForStruct(subStructName, json);
            if (subJson) {
                process(subStructName, subJson);
            }
        }
    }

    function findJsonForStruct(structName: string, currentJson: any): any {
        for (const key in currentJson) {
            const pascalKey = toPascalCase(key);
            if (pascalKey === structName && typeof currentJson[key] === 'object' && !Array.isArray(currentJson[key])) {
                return currentJson[key];
            }
             const singularPascalKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
            if (singularPascalKey === structName && Array.isArray(currentJson[key]) && currentJson[key].length > 0) {
                return currentJson[key][0];
            }
             if (typeof currentJson[key] === 'object' && currentJson[key] !== null) {
                const result = findJsonForStruct(structName, currentJson[key]);
                if (result) return result;
            }
        }
        return null;
    }

    process(rootStructName, json);
    return allStructs;
}


export function generateCppCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: CppGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const finalRootClassName = toPascalCase(rootClassName);
    const allStructs = collectAllStructs(json, finalRootClassName, options);
    const orderedStructNames = Array.from(allStructs.keys()).reverse();

    let header = `
#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>

namespace ${options.namespace} {

using nlohmann::json;

`;

    // Forward declare all structs
    for (const name of orderedStructNames) {
        header += `struct ${name};\n`;
    }
    header += `\n`;


    // Define all structs
    for (const name of orderedStructNames) {
        const defs = allStructs.get(name);
        if (defs) {
            header += defs.structDef + '\n';
        }
    }

    // Define all conversions
    for (const name of orderedStructNames) {
        const defs = allStructs.get(name);
        if (defs) {
            header += defs.conversionDef + '\n';
        }
    }
    
    header += `} // namespace ${options.namespace}\n`;

    return header;
}
