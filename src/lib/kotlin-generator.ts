

export interface KotlinGeneratorOptions {
    useVal: boolean;
    nullable: boolean;
    dataClass: boolean;
    defaultValues: boolean;
    serializationLibrary: 'none' | 'manual' | 'gson' | 'moshi' | 'kotlinx';
    defaultToNull: boolean;
}

const defaultOptions: KotlinGeneratorOptions = {
    useVal: true,
    nullable: true,
    dataClass: true,
    defaultValues: false,
    serializationLibrary: "none",
    defaultToNull: false,
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

function getKotlinType(value: any, key: string, classes: Set<string>, options: KotlinGeneratorOptions): string {
    if (value === null) {
        if (options.serializationLibrary === 'kotlinx') return 'JsonElement';
        return 'Any';
    }

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Int' : 'Double';
    if (type === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
        if (value.length === 0) {
             if (options.serializationLibrary === 'kotlinx') return 'List<JsonElement>';
             return 'List<Any>';
        }
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getKotlinType(value[0], singularKey, classes, options);
        
        return `List<${listType}>`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        classes.add(className);
        return className;
    }
    
    if (options.serializationLibrary === 'kotlinx') return 'JsonElement';
    return 'Any';
}

function getKotlinDefaultValue(kotlinType: string, options: KotlinGeneratorOptions): string {
    if (kotlinType.startsWith('List')) {
        return 'emptyList()';
    }

    switch (kotlinType) {
        case 'String': return '""';
        case 'Int': return '0';
        case 'Double': return '0.0';
        case 'Boolean': return 'false';
        case 'JsonElement': return 'JsonNull';
        case 'Any': return 'Any()';
        default: 
            return `${kotlinType}()`;
    }
}

function generateImports(options: KotlinGeneratorOptions, allCode: string): string {
    const imports = new Set<string>();
    
    if (allCode.includes('@SerializedName')) {
        imports.add('import com.google.gson.annotations.SerializedName');
    }
    if (allCode.includes('@Json(name')) {
        imports.add('import com.squareup.moshi.Json');
    }
    if (allCode.includes('@Serializable')) {
        imports.add('import kotlinx.serialization.Serializable');
    }
     if (allCode.includes('@SerialName')) {
        imports.add('import kotlinx.serialization.SerialName');
    }
    if (allCode.includes('JsonElement')) {
        imports.add('import kotlinx.serialization.json.JsonElement');
         if (options.defaultValues || options.defaultToNull) {
            imports.add('import kotlinx.serialization.json.JsonNull');
        }
    }
    return imports.size > 0 ? Array.from(imports).sort().join('\n') + '\n\n' : '';
}


function generateClass(className: string, jsonObject: Record<string, any>, options: KotlinGeneratorOptions): { classDef: string, dependentClasses: Set<string> } {
    const dependentClasses = new Set<string>();
    let classString = '';
    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    
    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const kotlinType = getKotlinType(jsonObject[key], key, dependentClasses, options);
        fields.push({ name: fieldName, originalKey: key, type: kotlinType, value: jsonObject[key] });
    }

    fields.sort((a,b) => a.name.localeCompare(b.name));

    if (options.serializationLibrary === 'kotlinx') {
        classString += '@Serializable\n';
    }
    const classType = options.dataClass ? 'data class' : 'class';
    classString += `${classType} ${className}(\n`;
    
    const fieldStrings = [];
    for (const field of fields) {
        let fieldString = '';
        const keyword = options.useVal ? 'val' : 'var';
        const nullableMarker = options.nullable ? '?' : '';
        const useSerializedName = options.serializationLibrary !== 'manual' && options.serializationLibrary !== 'none';
        
        let annotation = '';
        if (field.name !== field.originalKey && useSerializedName) {
            if (options.serializationLibrary === 'gson') {
                annotation = `    @SerializedName("${field.originalKey}")\n`;
            } else if (options.serializationLibrary === 'moshi') {
                annotation = `    @Json(name = "${field.originalKey}")\n`;
            } else if (options.serializationLibrary === 'kotlinx') {
                annotation = `    @SerialName("${field.originalKey}")\n`;
            }
        }
        
        let defaultValue = '';
        if (options.defaultValues) {
            defaultValue = ` = ${getKotlinDefaultValue(field.type, options)}`;
        } else if (options.defaultToNull && options.nullable) {
            defaultValue = ' = null';
        }

        fieldString += `${annotation}    ${keyword} ${field.name}: ${field.type}${nullableMarker}${defaultValue}`;
        fieldStrings.push(fieldString);
    }
    classString += fieldStrings.join(',\n');
    classString += `\n)`;

    const isManual = options.serializationLibrary === 'manual';

    if (isManual && fields.length > 0) {
        classString += ' {\n';

        classString += `    companion object {\n`;
        classString += `        fun fromJson(json: Map<String, Any>): ${className} {\n`;
        classString += `            return ${className}(\n`;
        for (const field of fields) {
            const jsonKey = field.originalKey;
            const fieldName = field.name;
            const kotlinType = field.type;
            const nullableMarker = options.nullable ? '?' : '';

            let parsingLogic: string;
            if (kotlinType.startsWith('List<')) {
                const listType = kotlinType.substring(5, kotlinType.length - 1);
                if (['Any', 'String', 'Int', 'Double', 'Boolean', 'JsonElement'].includes(listType)) {
                     parsingLogic = `(json["${jsonKey}"] as? List<*>)?.mapNotNull { it as? ${listType} }`;
                } else {
                     parsingLogic = `(json["${jsonKey}"] as? List<*>)?.mapNotNull { ${listType}.fromJson(it as Map<String, Any>) }`;
                }
            } else if (dependentClasses.has(kotlinType)) {
                parsingLogic = `json["${jsonKey}"]?.let { ${kotlinType}.fromJson(it as Map<String, Any>) }`;
            } else {
                parsingLogic = `json["${jsonKey}"] as? ${kotlinType}${nullableMarker}`;
            }
            
            let finalLogic = parsingLogic;
            if (!options.nullable) {
                finalLogic = `${parsingLogic} ?: ${getKotlinDefaultValue(kotlinType, options)}`;
            }

            classString += `                ${fieldName} = ${finalLogic},\n`;
        }
         if (fields.length > 0) {
            classString = classString.slice(0, -2); // remove last comma and newline
            classString += '\n';
        }

        classString += `            )\n        }\n    }\n\n`;
        
        classString += `    fun toJson(): Map<String, Any${options.nullable ? '?' : ''}> {\n`;
        classString += `        val map = mutableMapOf<String, Any?>()\n`;
        for (const field of fields) {
            let serializingLogic = field.name;
            if (field.type.startsWith('List<') && !field.type.includes('<Any>')) {
                const listType = field.type.substring(5, field.type.length - 1);
                if (dependentClasses.has(listType)) {
                    serializingLogic = `${field.name}?.map { it.toJson() }`;
                }
            } else if (dependentClasses.has(field.type)) {
                serializingLogic = `${field.name}?.toJson()`;
            }
            classString += `        map["${field.originalKey}"] = ${serializingLogic}\n`;
        }
        classString += `        return map.filterValues { it != null }\n    }\n`;
        classString += `}`;
    }

    return { classDef: classString, dependentClasses };
}


export function generateKotlinCode(
    json: any, 
    rootClassName: string = 'DataModel', 
    options: KotlinGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const toProcess: { name: string, json: any }[] = [{ name: toPascalCase(rootClassName), json }];
    const processed = new Set<string>();

    while (toProcess.length > 0) {
        const { name, json: currentJson } = toProcess.shift()!;
        if (processed.has(name)) continue;

        const { classDef, dependentClasses } = generateClass(name, currentJson, options);
        classes.set(name, classDef);
        processed.add(name);

        dependentClasses.forEach(depName => {
            const depJson = findJsonForClass(depName, json, toPascalCase(rootClassName));
            if (depJson) {
                toProcess.push({ name: depName, json: depJson });
            }
        });
    }

    const sortedClassNames = Array.from(classes.keys()).sort((a, b) => {
        const aDeps = classes.get(a) || '';
        const bDeps = classes.get(b) || '';
        if (aDeps.includes(` ${b}?`) || aDeps.includes(` ${b} `)) return 1;
        if (bDeps.includes(` ${a}?`) || bDeps.includes(` ${a} `)) return -1;
        return a.localeCompare(b);
    });

    
    const allCode = sortedClassNames.map(name => classes.get(name)).join('\n\n');
    const imports = generateImports(options, allCode);

    return imports + allCode;
}


function findJsonForClass(className: string, currentJson: any, rootName: string): any {
    if (toPascalCase(rootName) === className) {
        return currentJson;
    }

    for (const key in currentJson) {
        const value = currentJson[key];
        const pascalKey = toPascalCase(key);

        if (pascalKey === className && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return value;
        }

        const singularPascalKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        if (singularPascalKey === className && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            return value[0];
        }

        if (typeof value === 'object' && value !== null) {
            const result = findJsonForClass(className, value, key);
            if (result) return result;
        }
    }
    return null;
}
