
export interface JavaScriptGeneratorOptions {
    // Future options can be added here
}

const defaultOptions: JavaScriptGeneratorOptions = {};

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

function getJSDocType(value: any, key: string, classes: Set<string>): string {
    if (value === null) {
        return 'any';
    }
    if (isIsoDateString(value)) {
        return 'Date';
    }
    const type = typeof value;
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getJSDocType(value[0], singularKey, classes);
        return `${listType}[]`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        classes.add(className);
        return className;
    }
    return 'any';
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>): void {
    if (classes.has(className)) return;

    const dependentClasses = new Set<string>();
    let classString = `class ${className} {\n`;
    
    const fields: { name: string, type: string, originalKey: string, isDate: boolean, isObject: boolean, isObjectArray: boolean }[] = [];

    // JSDoc properties first
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const jsDocType = getJSDocType(jsonObject[key], key, dependentClasses);
        classString += `    /** @type {${jsDocType}|null} */\n`;
        classString += `    ${fieldName};\n\n`;

        fields.push({
            name: fieldName,
            type: jsDocType,
            originalKey: key,
            isDate: isIsoDateString(jsonObject[key]),
            isObject: typeof jsonObject[key] === 'object' && !Array.isArray(jsonObject[key]) && jsonObject[key] !== null,
            isObjectArray: Array.isArray(jsonObject[key]) && jsonObject[key].length > 0 && typeof jsonObject[key][0] === 'object',
        });
    }
     if (Object.keys(jsonObject).length === 0) {
        classString += `\n`;
    }


    // Constructor
    classString += `    constructor(data = {}) {\n`;
    for (const field of fields) {
        let assignment = `data.${field.originalKey} ?? null`;
        if (field.isDate) {
            assignment = `data.${field.originalKey} ? new Date(data.${field.originalKey}) : null`;
        } else if (field.isObjectArray) {
            const singularType = toPascalCase(field.originalKey.endsWith('s') ? field.originalKey.slice(0, -1) : field.originalKey);
            assignment = `Array.isArray(data.${field.originalKey}) ? data.${field.originalKey}.map(item => new ${singularType}(item)) : null`;
        } else if (field.isObject) {
             assignment = `data.${field.originalKey} ? new ${field.type}(data.${field.originalKey}) : null`;
        }
        classString += `        this.${field.name} = ${assignment};\n`;
    }
    classString += `    }\n\n`;
    
    // fromJSON static method
    classString += `    static fromJSON(data) {\n`;
    classString += `        return new ${className}(data);\n`;
    classString += `    }\n\n`;

    // toJSON method
    classString += `    toJSON() {\n`;
    classString += `        return {\n`;
    for (const field of fields) {
         let serialization = `this.${field.name}`;
         if (field.isDate) {
            serialization = `this.${field.name}?.toISOString()`;
         } else if (field.isObjectArray) {
            serialization = `this.${field.name}?.map(item => item.toJSON())`;
         }
         else if (field.isObject) {
              serialization = `this.${field.name}?.toJSON()`;
         }
        classString += `            "${field.originalKey}": ${serialization},\n`;
    }
    classString += `        };\n`;
    classString += `    }\n`;


    classString += '}\n';

    classes.set(className, classString);
    
    // Recursively generate for sub-objects
    for (const key in jsonObject) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null && !isIsoDateString(value)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                 const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                 generateClass(singularKey, value[0], classes);
            } else if (!Array.isArray(value)) {
                generateClass(toPascalCase(key), value, classes);
            }
        }
    }
}


export function generateJavaScriptCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: JavaScriptGeneratorOptions = {}
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        return `class ${toPascalCase(rootClassName)} {\n    constructor(data = {}) {}\n\n    static fromJSON(data) {\n        return new ${toPascalCase(rootClassName)}(data);\n    }\n\n    toJSON() {\n        return {};\n    }\n}\n`;
    }
    
    const classes = new Map<string, string>();
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, { ...json }, classes);
    
    const orderedClasses = Array.from(classes.keys()).reverse();

    return orderedClasses.map(name => classes.get(name)).join('\n');
}

    