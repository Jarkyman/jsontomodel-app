// Utility functions
function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function toCamelCase(str: string): string {
    return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

// Type mapping and class generation
function getDartType(value: any, key: string, classes: Map<string, string>): string {
    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'int' : 'double';
    if (type === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'List<dynamic>';
        const listType = getDartType(value[0], key.endsWith('s') ? key.slice(0, -1) : key, classes);
        return `List<${listType}>`;
    }
    if (type === 'object' && value !== null) {
        const className = toPascalCase(key);
        // This is a simplified check. A more robust solution would be to compare structures.
        if (!classes.has(className)) {
            generateClass(className, value, classes);
        }
        return className;
    }
    return 'dynamic';
}

function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>): void {
    let classString = `class ${className} {\n`;
    const constructorParams: string[] = [];

    for (const key in jsonObject) {
        const dartType = getDartType(jsonObject[key], key, classes);
        const camelCaseKey = toCamelCase(key);
        classString += `  final ${dartType}? ${camelCaseKey};\n`;
        constructorParams.push(`this.${camelCaseKey}`);
    }

    classString += `\n  ${className}({\n    ${constructorParams.join(',\n    ')},\n  });\n\n`;
    
    // fromJson factory
    classString += `  factory ${className}.fromJson(Map<String, dynamic> json) {\n`;
    classString += `    return ${className}(\n`;
    for (const key in jsonObject) {
        const camelCaseKey = toCamelCase(key);
        const value = jsonObject[key];

        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
            const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
            const itemClassName = toPascalCase(singularKey);
             classString += `      ${camelCaseKey}: json['${key}'] != null ? List<${itemClassName}>.from(json['${key}'].map((x) => ${itemClassName}.fromJson(x))) : null,\n`;
        } else if (Array.isArray(value)) {
            const listType = getDartType(value.length > 0 ? value[0] : null, key, new Map());
            classString += `      ${camelCaseKey}: json['${key}'] != null ? List<${listType}>.from(json['${key}']) : null,\n`;
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nestedClassName = toPascalCase(key);
            classString += `      ${camelCaseKey}: json['${key}'] != null ? ${nestedClassName}.fromJson(json['${key}']) : null,\n`;
        } else {
            classString += `      ${camelCaseKey}: json['${key}'],\n`;
        }
    }
    classString += `    );\n  }\n`;

    // toJson method
    classString += `\n  Map<String, dynamic> toJson() {\n`;
    classString += `    return {\n`;
     for (const key in jsonObject) {
        const camelCaseKey = toCamelCase(key);
         if (Array.isArray(jsonObject[key]) && jsonObject[key].length > 0 && typeof jsonObject[key][0] === 'object') {
            classString += `      '${key}': ${camelCaseKey}?.map((x) => x.toJson()).toList(),\n`;
        } else if (typeof jsonObject[key] === 'object' && jsonObject[key] !== null && !Array.isArray(jsonObject[key])) {
             classString += `      '${key}': ${camelCaseKey}?.toJson(),\n`;
        }
        else {
            classString += `      '${key}': ${camelCaseKey},\n`;
        }
    }
    classString += `    };\n  }\n`;


    classString += '}\n';
    classes.set(className, classString);
}


export function generateDartCode(json: any, rootClassName: string = 'DataModel'): string {
    if (typeof json !== 'object' || json === null) {
        throw new Error("Invalid JSON object provided.");
    }

    const classes = new Map<string, string>();
    generateClass(rootClassName, json, classes);

    return Array.from(classes.values()).join('\n');
}
