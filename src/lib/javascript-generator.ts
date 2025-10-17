
export interface JavaScriptGeneratorOptions {
    includeJSDoc: boolean;
    includeFromToJSON: boolean;
    convertDates: boolean;
}

const defaultOptions: JavaScriptGeneratorOptions = {
    includeJSDoc: true,
    includeFromToJSON: true,
    convertDates: true,
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

function isIsoDateString(value: any, options: JavaScriptGeneratorOptions): boolean {
    if (!options.convertDates || typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getJSDocType(value: any, key: string, classes: Set<string>, options: JavaScriptGeneratorOptions): string {
    if (value === null) {
        return 'any';
    }
    if (isIsoDateString(value, options)) {
        return 'Date';
    }
    const type = typeof value;
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getJSDocType(value[0], singularKey, classes, options);
        return `${listType}[]`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        classes.add(className);
        return className;
    }
    return 'any';
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: JavaScriptGeneratorOptions): void {
    if (classes.has(className)) return;

    const dependentClasses = new Set<string>();
    let classString = `class ${className} {\n`;
    
    const fields: {name: string, jsdoc: string}[] = [];
    const constructorAssignments: {name: string, assignment: string}[] = [];
    const toJSONFields: {key: string, serialization: string}[] = [];

    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const value = jsonObject[key];
        const jsDocType = getJSDocType(value, key, dependentClasses, options);

        fields.push({
            name: fieldName,
            jsdoc: `/** @type {${jsDocType}|null} */\n    ${fieldName};`
        });

        const isDate = isIsoDateString(value, options);
        const isObject = typeof value === 'object' && !Array.isArray(value) && value !== null;
        const isObjectArray = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object';
        
        let assignment = `data.${key} ?? null`;
        let serialization = `this.${fieldName}`;

        if (isDate) {
            assignment = `data.${key} ? new Date(data.${key}) : null`;
            serialization = `this.${fieldName}?.toISOString()`;
        } else if (isObjectArray) {
            const singularType = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
            assignment = `Array.isArray(data.${key}) ? data.${key}.map(item => new ${singularType}(item)) : null`;
            serialization = `this.${fieldName}?.map(item => item.toJSON())`;
        } else if (isObject) {
             assignment = `data.${key} ? new ${jsDocType}(data.${key}) : null`;
             serialization = `this.${fieldName}?.toJSON()`;
        }

        constructorAssignments.push({ name: fieldName, assignment });
        toJSONFields.push({ key, serialization });
    }

    // JSDoc properties first
    if (options.includeJSDoc && fields.length > 0) {
        classString += fields.map(f => `    ${f.jsdoc}\n`).join('\n');
    }

    // Constructor
    classString += `\n    constructor(data = {}) {\n`;
    for (const item of constructorAssignments) {
        classString += `        this.${item.name} = ${item.assignment};\n`;
    }
    classString += `    }\n`;
    
    if (options.includeFromToJSON) {
        // fromJSON static method
        classString += `\n    static fromJSON(data) {\n`;
        classString += `        return new ${className}(data);\n`;
        classString += `    }\n`;

        // toJSON method
        classString += `\n    toJSON() {\n`;
        classString += `        return {\n`;
        const toJSONLines = toJSONFields.map(f => `            "${f.key}": ${f.serialization}`);
        classString += toJSONLines.join(',\n');
        classString += `\n        };\n`;
        classString += `    }\n`;
    }


    classString += '}\n';

    classes.set(className, classString);
    
    // Recursively generate for sub-objects
    for (const key of sortedKeys) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null && !isIsoDateString(value, options)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                 const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                 generateClass(singularKey, value[0], classes, options);
            } else if (!Array.isArray(value)) {
                generateClass(toPascalCase(key), value, classes, options);
            }
        }
    }
}


export function generateJavaScriptCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: JavaScriptGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        let emptyClass = `class ${toPascalCase(rootClassName)} {\n    constructor(data = {}) {}\n`;
        if (options.includeFromToJSON) {
            emptyClass += `\n    static fromJSON(data) {\n        return new ${toPascalCase(rootClassName)}(data);\n    }\n\n    toJSON() {\n        return {};\n    }\n`;
        }
        emptyClass += '}\n';
        return emptyClass;
    }
    
    const classes = new Map<string, string>();
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, { ...json }, classes, options);
    
    const orderedClasses = Array.from(classes.keys()).reverse();

    return orderedClasses.map(name => classes.get(name)).join('\n');
}
