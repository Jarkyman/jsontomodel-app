

export interface CppGeneratorOptions {
    namespace: string;
    usePointersForNull: boolean;
    cppVersion: '17' | '20' | '03';
    useNlohmann: boolean;
}

const defaultOptions: CppGeneratorOptions = {
    namespace: "DataModels",
    usePointersForNull: false, // This will be determined by cppVersion
    cppVersion: '17',
    useNlohmann: true,
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

function getBaseCppType(value: any, key: string, structs: Set<string>, options: CppGeneratorOptions): string {
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
        const listType = getBaseCppType(value[0], singularKey, structs, options);
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
    // Determine which nullability mechanism to use based on C++ version
    const useOptional = options.cppVersion !== '03';
    
    let structDef = `struct ${structName} {\n`;
    let conversionDef = options.useNlohmann ? `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(${structName}` : '';

    const fields: { name: string, type: string, originalKey: string }[] = [];
    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toSnakeCase(key);
        const baseCppType = getBaseCppType(jsonObject[key], key, structs, options);
        
        let finalType: string;
        let fieldDefinition: string;

        if (useOptional) {
            finalType = `std::optional<${baseCppType}>`;
            fieldDefinition = `    ${finalType} ${fieldName}`;
            if (options.cppVersion === '20') {
                fieldDefinition += ` = std::nullopt;`;
            } else {
                fieldDefinition += `;`;
            }
        } else {
            // Legacy C++03 mode using raw pointers
            finalType = `${baseCppType}*`;
            fieldDefinition = `    ${finalType} ${fieldName};`;
        }

        structDef += `${fieldDefinition}\n`;
        fields.push({ name: fieldName, type: baseCppType, originalKey: key });
    }
    structDef += '};\n';
    
    if (options.useNlohmann) {
        for(const field of fields) {
            conversionDef += `, ${field.name}`;
        }
        conversionDef += ');\n';
    }


    // Recursively generate for sub-objects that were identified
    for (const key of sortedKeys) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                 const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                 generateStruct(singularKey, value[0], structs, options);
            } else if (!Array.isArray(value)) {
                generateStruct(toPascalCase(key), value, classes, options);
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
    
    // Automatically set usePointersForNull based on C++ version
    const internalOptions = { ...options, usePointersForNull: options.cppVersion === '03' };
    
    const finalRootClassName = toPascalCase(rootClassName);
    const allStructs = collectAllStructs(json, finalRootClassName, internalOptions);
    const orderedStructNames = Array.from(allStructs.keys()).reverse();
    const useOptional = internalOptions.cppVersion !== '03';

    let header = `#pragma once

#include <string>
#include <vector>
`;
    if (useOptional) {
       header += `#include <optional>\n`;
    }

    if (internalOptions.useNlohmann) {
        header += `#include <nlohmann/json.hpp>\n`;
    }

    header += `
namespace ${options.namespace} {\n\n`;

    if (internalOptions.useNlohmann) {
        header += `using nlohmann::json;\n\n`;
    }


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
    if (internalOptions.useNlohmann) {
        for (const name of orderedStructNames) {
            const defs = allStructs.get(name);
            if (defs) {
                header += defs.conversionDef + '\n';
            }
        }
    }
    
    header += `} // namespace ${options.namespace}\n`;

    return header;
}

    