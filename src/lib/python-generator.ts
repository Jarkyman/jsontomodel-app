
export interface PythonGeneratorOptions {
    dataclass: boolean;
    frozen: boolean;
    slots: boolean;
    fromDict: boolean;
    toDict: boolean;
    typeHints: boolean;
    defaultValues: boolean;
    camelCaseToSnakeCase: boolean;
    includeRepr: boolean;
    includeEq: boolean;
    includeHash: boolean;
    nestedClasses: boolean;
    sampleInstance: boolean;
}

const defaultOptions: PythonGeneratorOptions = {
    dataclass: true,
    frozen: false,
    slots: false,
    fromDict: true,
    toDict: true,
    typeHints: true,
    defaultValues: false,
    camelCaseToSnakeCase: true,
    includeRepr: true,
    includeEq: true,
    includeHash: false,
    nestedClasses: true,
    sampleInstance: false,
};

function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function toSnakeCase(str: string): string {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // Add underscore between camelCase
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2') // Add underscore for acronyms like 'ID'
        .toLowerCase();
}


function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getPythonType(value: any, key: string, classes: Map<string, string>, options: PythonGeneratorOptions): string {
    if (value === null) return 'Any';

    const type = typeof value;
    if (type === 'string') {
        return isIsoDateString(value) ? 'datetime' : 'str';
    }
    if (type === 'number') {
        return value % 1 === 0 ? 'int' : 'float';
    }
    if (type === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'List[Any]';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getPythonType(value[0], singularKey, classes, options);
        return `List[${listType}]`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (options.nestedClasses && !classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return options.nestedClasses ? className : 'Dict[str, Any]';
    }
    return 'Any';
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: PythonGeneratorOptions): void {
    if (classes.has(className)) return;

    const dataclassArgs = [];
    if (options.frozen) dataclassArgs.push('frozen=True');
    if (options.slots) dataclassArgs.push('slots=True');
    
    if (!options.includeRepr) dataclassArgs.push('repr=False');
    if (!options.includeEq) dataclassArgs.push('eq=False');
    if (options.includeHash) dataclassArgs.push('unsafe_hash=True');

    const decorator = options.dataclass ? `@dataclass(${dataclassArgs.join(', ')})\n` : '';
    let classString = `${decorator}class ${className}:\n`;

    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    if (Object.keys(jsonObject).length === 0) {
        classString += `    pass\n`;
    } else {
        for (const key in jsonObject) {
            if (key === '') continue;
            const fieldName = options.camelCaseToSnakeCase ? toSnakeCase(key) : key;
            const pythonType = getPythonType(jsonObject[key], key, classes, options);
            const finalType = `Optional[${pythonType}]`;
            
            if (options.typeHints) {
                classString += `    ${fieldName}: ${finalType}\n`;
            } else {
                 classString += `    ${fieldName}\n`;
            }
            fields.push({ name: fieldName, type: pythonType, originalKey: key, value: jsonObject[key] });
        }
    }

    if (options.fromDict) {
        classString += `\n    @classmethod\n`;
        classString += `    def from_dict(cls, data: Dict[str, Any]) -> "${className}":\n`;
        classString += `        return cls(\n`;
        for (const field of fields) {
            const key = field.originalKey;
            const fieldName = field.name;
            const fieldType = field.type;

            if (fieldType.startsWith('List[') && options.nestedClasses) {
                 const itemType = fieldType.substring(5, fieldType.length - 1);
                 if (classes.has(itemType)) {
                    classString += `            ${fieldName}=[${itemType}.from_dict(item) for item in data.get("${key}", []) if item is not None],\n`;
                 } else {
                    classString += `            ${fieldName}=data.get("${key}"),\n`;
                 }
            } else if (classes.has(fieldType) && options.nestedClasses) {
                classString += `            ${fieldName}=${fieldType}.from_dict(data["${key}"]) if data.get("${key}") is not None else None,\n`;
            } else if (fieldType === 'datetime') {
                 classString += `            ${fieldName}=datetime.fromisoformat(data["${key}"]) if data.get("${key}") is not None else None,\n`;
            }
            else {
                classString += `            ${fieldName}=data.get("${key}"),\n`;
            }
        }
        classString += `        )\n`;
    }

    if (options.toDict) {
        classString += `\n    def to_dict(self) -> Dict[str, Any]:\n`;
        classString += `        return {\n`;
         for (const field of fields) {
            const key = field.originalKey;
            const fieldName = field.name;
            const fieldType = field.type;

            if (fieldType.startsWith('List[') && options.nestedClasses) {
                 const itemType = fieldType.substring(5, fieldType.length - 1);
                 if (classes.has(itemType)) {
                    classString += `            "${key}": [item.to_dict() for item in self.${fieldName}] if self.${fieldName} is not None else [],\n`;
                 } else {
                    classString += `            "${key}": self.${fieldName},\n`;
                 }
            } else if (classes.has(fieldType) && options.nestedClasses) {
                classString += `            "${key}": self.${fieldName}.to_dict() if self.${fieldName} is not None else None,\n`;
            } else if (fieldType === 'datetime') {
                 classString += `            "${key}": self.${fieldName}.isoformat() if self.${fieldName} is not None else None,\n`;
            } else {
                classString += `            "${key}": self.${fieldName},\n`;
            }
        }
        classString += `        }\n`;
    }

    classes.set(className, classString);

    if (options.nestedClasses) {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                    const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                    generateClass(singularKey, value[0], classes, options);
                } else if (!Array.isArray(value)) {
                    generateClass(toPascalCase(key), value, classes, options);
                }
            }
        }
    }
}


export function generatePythonCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: PythonGeneratorOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }

    const classes = new Map<string, string>();
    const rootJson = { ...json };
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, rootJson, classes, options);
    
    const codeString = Array.from(classes.values()).join('\n');
    const needsTyping = options.typeHints && (codeString.includes('Optional[') || codeString.includes('List[') || codeString.includes('Dict[') || codeString.includes('Any'));
    const needsDatetime = codeString.includes('datetime');
    const needsDataclass = options.dataclass;


    let imports = '';
    if (needsDataclass) {
        imports += `from dataclasses import dataclass\n`;
    }
     if (needsTyping) {
        imports += `from typing import Any, Dict, List, Optional\n`;
    }
    if (needsDatetime) {
        imports += `from datetime import datetime\n`;
    }
    imports += `\n`;


    function findJsonForClass(className: string, currentJson: any, currentName: string): any {
        if (toPascalCase(currentName) === className) {
            return currentJson;
        }

        if (typeof currentJson === 'object' && currentJson !== null) {
            for (const key in currentJson) {
                const value = currentJson[key];
                const pascalKey = toPascalCase(key);
                if (pascalKey === className) {
                    if (Array.isArray(value)) return value[0] ?? {};
                    return value;
                }
                const singularPascalKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                if (singularPascalKey === className && Array.isArray(value) && value.length > 0) {
                    return value[0];
                }
                const result = findJsonForClass(className, value, key);
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

    const finalCode = orderedClasses
      .map(name => finalClasses.get(name))
      .filter(Boolean)
      .join('\n\n');


    return `${imports}\n` + finalCode;
}
