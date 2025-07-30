
export interface CppGeneratorOptions {
    namespace: string;
    usePointersForNull: boolean;
    cppVersion: '17' | '20' | '03';
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
    const useOptional = options.cppVersion !== '03' && !options.usePointersForNull;
    
    if (value === null) {
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
        // Pointers/optionals are handled on the member, not in the vector type itself for this generator's style
        return `std::vector<${listType.replace('*', '')}>`;
    }
    if (type === 'object') {
        const structName = toPascalCase(key);
        structs.add(structName);
        return structName;
    }
    return 'nlohmann::json'; // Fallback for any other type
}


function generateStruct(structName: string, jsonObject: Record<string, any>, structs: Set<string>, options: CppGeneratorOptions): { structDef: string, conversionDef: string } {
    const useOptional = options.cppVersion !== '03' && !options.usePointersForNull;
    let structDef = `struct ${structName} {\n`;
    let conversionDef = `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(${structName}`;

    const fields: { name: string, type: string, originalKey: string }[] = [];
    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toSnakeCase(key);
        const cppType = getCppType(jsonObject[key], key, structs, options);
        
        let finalType: string;
        if (useOptional) {
            finalType = `std::optional<${cppType}>`;
        } else {
             // For pointers, only apply to non-primitive/non-vector types unless it's a nullable value
            if (jsonObject[key] === null || typeof jsonObject[key] === 'object') {
                 finalType = `${cppType}*`;
            } else {
                 finalType = cppType;
            }
        }
        
        // Handle case where type was already determined as pointer, e.g. from nullable object.
        if (finalType.endsWith('**')) {
            finalType = finalType.slice(0, -1);
        }

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

    function process(structName: string, currentJson: any) {
        if (allStructs.has(structName) || !currentJson || typeof currentJson !== 'object') {
            return;
        }

        const identifiedSubStructs = new Set<string>();
        const { structDef, conversionDef } = generateStruct(structName, currentJson, identifiedSubStructs, options);
        allStructs.set(structName, { structDef, conversionDef });

        identifiedSubStructs.forEach(subStructName => {
            const subJson = findJsonForStruct(subStructName, json);
            if (subJson) {
                process(subStructName, subJson);
            }
        });
    }
    
    function findJsonForStruct(structName: string, currentJson: any): any {
        for (const key in currentJson) {
            const pascalKey = toPascalCase(key);
            if (pascalKey === structName && typeof currentJson[key] === 'object' && currentJson[key] !== null && !Array.isArray(currentJson[key])) {
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
    const useOptional = options.cppVersion !== '03' && !options.usePointersForNull;

    let header = `#pragma once

#include <string>
#include <vector>
`;
    if (useOptional) {
       header += `#include <optional>\n`;
    }

    header += `#include <nlohmann/json.hpp>

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
