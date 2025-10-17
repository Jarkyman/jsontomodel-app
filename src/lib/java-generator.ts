
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
  noArgsConstructor: false,
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

    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];

    // Fields
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = options.snakeCase ? toCamelCase(key) : key;
        const javaType = getJavaType(jsonObject[key], key, classes, options);
        fields.push({ name: fieldName, type: javaType, originalKey: key, value: jsonObject[key] });

        if (javaType.startsWith('List<')) {
            imports.add('import java.util.List;');
        }
        
        if (javaType.includes("Date")) {
            imports.add('import java.util.Date;');
        }

        if (options.jsonAnnotations) {
            imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
            classString += `    @JsonProperty("${key}")\n`;
        }
        
        const finalModifier = options.finalFields ? "final " : "";
        classString += `    private ${finalModifier}${javaType} ${fieldName};\n\n`;
    }

    // No-Args Constructor
    if (options.noArgsConstructor) {
        classString += `    public ${className}() {}\n\n`;
    }

    // All-Args Constructor
    if (options.constructor && fields.length > 0) {
        classString += `    public ${className}(`;
        const params = fields.map(field => {
            let paramString = "";
            if (options.jsonAnnotations) {
                paramString += `@JsonProperty("${field.originalKey}") `;
            }
            paramString += `${field.type} ${field.name}`;
            return paramString;
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

    // Setters
    if (options.setters && !options.finalFields) {
        for (const field of fields) {
            const setterName = 'set' + toPascalCase(field.name);
            classString += `    public void ${setterName}(${field.type} ${field.name}) {\n`;
            classString += `        this.${field.name} = ${field.name};\n`;
            classString += `    }\n\n`;
        }
    }

    // toString
    if (options.toString) {
        imports.add('import java.util.StringJoiner;');
        classString += `    @Override\n`;
        classString += `    public String toString() {\n`;
        classString += `        return new StringJoiner(", ", ${className}.class.getSimpleName() + "[", "]")\n`;
        for (const field of fields) {
            classString += `                .add("${field.name}=" + ${field.name})\n`;
        }
        classString += `                .toString();\n`;
        classString += `    }\n\n`;
    }
    
    // equals & hashCode
    if (options.equalsHashCode) {
        imports.add('import java.util.Objects;');
        // equals
        classString += `    @Override\n`;
        classString += `    public boolean equals(Object o) {\n`;
        classString += `        if (this == o) return true;\n`;
        classString += `        if (o == null || getClass() != o.getClass()) return false;\n`;
        classString += `        ${className} that = (${className}) o;\n`;
        const comparisons = fields.map(f => `Objects.equals(${f.name}, that.${f.name})`).join(' && ');
        classString += `        return ${comparisons || 'true'};\n`;
        classString += `    }\n\n`;

        // hashCode
        classString += `    @Override\n`;
        classString += `    public int hashCode() {\n`;
        const fieldNames = fields.map(f => f.name).join(', ');
        classString += `        return Objects.hash(${fieldNames});\n`;
        classString += `    }\n\n`;
    }


    // Builder
    if (options.builder) {
        classString += `    public static final class Builder {\n`;
        for (const field of fields) {
            classString += `        private ${field.type} ${field.name};\n`;
        }
        classString += `\n        public Builder() {}\n\n`;

        for (const field of fields) {
            const withMethodName = options.snakeCase ? toCamelCase(field.originalKey) : field.originalKey;
            classString += `        public Builder ${withMethodName}(${field.type} val) {\n`;
            classString += `            ${field.name} = val;\n`;
            classString += `            return this;\n`;
            classString += `        }\n\n`;
        }

        classString += `        public ${className} build() {\n`;
        if (options.constructor && fields.length > 0) {
             const builderFields = fields.map(f => `this.${f.name}`).join(', ');
             classString += `            return new ${className}(${builderFields});\n`;
        } else {
             classString += `            ${className} instance = new ${className}();\n`;
             for(const field of fields) {
                 if (options.setters && !options.finalFields) {
                    classString += `            instance.set${toPascalCase(field.name)}(this.${field.name});\n`;
                 }
             }
             classString += `            return instance;\n`;
        }
        classString += `        }\n`;
        classString += `    }\n`;
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
    const mainClassDef = classes.get(finalRootClassName) || '';
    
    // Find where to inject nested classes
    const mainClassClosingBrace = mainClassDef.lastIndexOf('}');
    if (mainClassClosingBrace === -1) {
        return mainClassDef; // Should not happen
    }
    
    const mainClassStart = mainClassDef.substring(0, mainClassClosingBrace);
    const mainClassEnd = mainClassDef.substring(mainClassClosingBrace);

    let finalCode = mainClassStart;

    orderedClasses.forEach(name => {
        if (name !== finalRootClassName) {
            const classDef = classes.get(name) || '';
            // Remove imports from nested classes as they are at the top level
            const defWithoutImports = classDef.replace(/import\s+.*;\n/g, '').trim();
            const staticClassDef = defWithoutImports.replace('public class', 'public static class');
            finalCode += `\n    ${staticClassDef}\n`;
        }
    });

    finalCode += mainClassEnd;

    // Collect all unique imports
    const allImports = new Set<string>();
    classes.forEach(classDef => {
        const importMatches = classDef.match(/import\s+.*;/g);
        if (importMatches) {
            importMatches.forEach(imp => allImports.add(imp));
        }
    });

    const sortedImports = Array.from(allImports).sort().join('\n');
    const finalCodeWithoutImports = finalCode.replace(/import\s+.*;\n\n/g, '').trim();

    return `${sortedImports}\n\n${finalCodeWithoutImports}`;
}
