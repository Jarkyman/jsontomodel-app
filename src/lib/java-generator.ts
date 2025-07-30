
export interface JavaGeneratorOptions {
  getters: boolean;
  setters: boolean;
  constructor: boolean;
  noArgsConstructor: boolean;
  builder: boolean;
  equalsHashCode: boolean;
  toString: boolean;
  snakeCase: boolean;
  nested: boolean;
  finalFields: boolean;
  jsonAnnotations: boolean;
}

const defaultOptions: JavaGeneratorOptions = {
  getters: true,
  setters: false,
  constructor: true,
  noArgsConstructor: true,
  builder: true,
  equalsHashCode: true,
  toString: true,
  snakeCase: true,
  nested: true,
  finalFields: true,
  jsonAnnotations: true,
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

function getJavaType(value: any, key: string, classes: Map<string, string>, options: JavaGeneratorOptions): string {
    if (value === null) return 'Object';
    
    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Integer' : 'Double';
    if (type === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'List<Object>';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getJavaType(value[0], singularKey, classes, options);
        return `List<${listType}>`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (options.nested && !classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return options.nested ? className : 'Object';
    }
    return 'Object';
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: JavaGeneratorOptions): void {
    if (classes.has(className)) return;

    let imports = new Set<string>();
    let classString = '';
    
    if (options.nested && classes.size > 0) {
        classString += `public static class ${className} {\n`;
    } else {
        classString += `public class ${className} {\n`;
    }

    const fields: { name: string, type: string, originalKey: string }[] = [];

    // Fields
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = options.snakeCase ? toCamelCase(key) : key;
        const javaType = getJavaType(jsonObject[key], key, classes, options);
        fields.push({ name: fieldName, type: javaType, originalKey: key });

        if (javaType.startsWith('List<')) {
            imports.add('import java.util.List;');
        }

        if (options.jsonAnnotations) {
            imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
            classString += `    @JsonProperty("${key}")\n`;
        }
        
        const finalModifier = options.finalFields ? 'final ' : '';
        classString += `    private ${finalModifier}${javaType} ${fieldName};\n\n`;
    }

    // Constructor
    if (options.constructor && fields.length > 0) {
        classString += `    public ${className}(`;
        const params = fields.map((field, index) => {
            if (options.jsonAnnotations) {
                return `@JsonProperty("${field.originalKey}") ${field.type} ${field.name}`;
            }
            return `${field.type} ${field.name}`;
        }).join(', ');
        classString += `${params}) {\n`;
        for (const field of fields) {
            classString += `        this.${field.name} = ${field.name};\n`;
        }
        classString += `    }\n\n`;
    }
    
    // Getters
    if (options.getters) {
        for (const field of fields) {
            const getterName = 'get' + toPascalCase(field.name);
            classString += `    public ${field.type} ${getterName}() {\n`;
            classString += `        return ${field.name};\n`;
            classString += `    }\n\n`;
        }
    }


    classString += `}\n`;
    
    let finalClassString = '';
    if (imports.size > 0) {
        finalClassString += Array.from(imports).sort().join('\n') + '\n\n';
    }
    finalClassString += classString;

    classes.set(className, finalClassString);

    if (options.nested) {
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


export function generateJavaCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: JavaGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }

    const classes = new Map<string, string>();
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, { ...json }, classes, options);

    const orderedClasses = Array.from(classes.keys()).reverse();
    const mainClass = classes.get(finalRootClassName) || '';
    const nestedClasses = orderedClasses
        .filter(name => name !== finalRootClassName)
        .map(name => classes.get(name) || '')
        .join('\n');
    
    // This is a simplified assembly. A more robust solution would properly nest the classes.
    // For now, we'll just combine them, which works for static nested classes.
    const mainClassBodyEnd = mainClass.lastIndexOf('}');
    if (mainClassBodyEnd !== -1) {
        const finalCode = mainClass.slice(0, mainClassBodyEnd) + nestedClasses + mainClass.slice(mainClassBodyEnd);
        return finalCode;
    }

    return mainClass;
}
