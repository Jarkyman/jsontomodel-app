
export interface KotlinGeneratorOptions {
    useVal: boolean;
    nullable: boolean;
    dataClass: boolean;
    fromJson: boolean;
    toJson: boolean;
    useSerializedName: boolean;
    defaultValues: boolean;
    serializationLibrary: 'manual' | 'gson' | 'moshi' | 'kotlinx';
    defaultToNull: boolean;
}

const defaultOptions: KotlinGeneratorOptions = {
    useVal: true,
    nullable: true,
    dataClass: true,
    fromJson: true,
    toJson: true,
    useSerializedName: false,
    defaultValues: false,
    serializationLibrary: "manual",
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

function getKotlinType(value: any, key: string, classes: Map<string, string>, options: KotlinGeneratorOptions): string | null {
    if (value === null) {
        if (options.serializationLibrary === 'kotlinx') return 'JsonElement';
        if (options.serializationLibrary === 'manual') return 'Any';
        // For Moshi/Gson, we will omit the field if the value is null, as we cannot infer the type.
        return null; 
    }

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Int' : 'Double';
    if (type === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
        if (value.length === 0) {
             if (options.serializationLibrary === 'kotlinx') return 'List<JsonElement>';
             if (options.serializationLibrary === 'manual') return 'List<Any>';
             // For Moshi/Gson, we will omit the field for empty lists.
             return null;
        }
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getKotlinType(value[0], singularKey, classes, options);
        
        if (listType === null) return null;

        return `List<${listType}>`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return className;
    }
    
    // For 'undefined' or other types
    if (options.serializationLibrary === 'kotlinx') return 'JsonElement';
    if (options.serializationLibrary === 'manual') return 'Any';
    
    return null;
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


function generateImports(options: KotlinGeneratorOptions, fields: { originalKey: string, name: string, type: string }[]): string {
    const imports = new Set<string>();

    if (options.serializationLibrary === 'gson' && fields.some(f => f.originalKey !== f.name)) {
        imports.add('import com.google.gson.annotations.SerializedName');
    }
    if (options.serializationLibrary === 'moshi' && fields.some(f => f.originalKey !== f.name)) {
        imports.add('import com.squareup.moshi.Json');
    }
    if (options.serializationLibrary === 'kotlinx') {
        imports.add('import kotlinx.serialization.Serializable');
        if (fields.some(f => f.originalKey !== f.name)) {
            imports.add('import kotlinx.serialization.SerialName');
        }
        if (fields.some(f => f.type.includes('JsonElement'))) {
            imports.add('import kotlinx.serialization.json.JsonElement');
            if (options.defaultValues || options.defaultToNull) {
                imports.add('import kotlinx.serialization.json.JsonNull');
            }
        }
    }
    return imports.size > 0 ? Array.from(imports).join('\n') + '\n\n' : '';
}

function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: KotlinGeneratorOptions): void {
    if (classes.has(className)) return;

    let classString = '';
    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const kotlinType = getKotlinType(jsonObject[key], key, classes, options);

        if (kotlinType) {
            fields.push({ name: fieldName, originalKey: key, type: kotlinType, value: jsonObject[key] });
        }
    }
    
    classString += generateImports(options, fields);

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
        
        let annotation = '';
        if (field.name !== field.originalKey && options.useSerializedName) {
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

    if (isManual && (options.fromJson || options.toJson) && fields.length > 0) {
        classString += ' {\n';

        if (options.fromJson) {
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
                        parsingLogic = `(json["${jsonKey}"] as? List<*>)?.map { it as ${listType} }`;
                    } else {
                        parsingLogic = `(json["${jsonKey}"] as? List<Map<String, Any>>)?.map { ${listType}.fromJson(it) }`;
                    }
                } else if (classes.has(kotlinType)) {
                    parsingLogic = `json["${jsonKey}"]?.let { ${kotlinType}.fromJson(it as Map<String, Any>) }`;
                } else {
                    parsingLogic = `json["${jsonKey}"] as? ${kotlinType}${nullableMarker}`;
                }
                
                let finalLogic = parsingLogic;
                if (options.nullable) {
                    finalLogic = parsingLogic;
                } else {
                    finalLogic = `${parsingLogic} ?: ${getKotlinDefaultValue(kotlinType, options)}`;
                }


                classString += `                ${fieldName} = ${finalLogic},\n`;
            }
            if (fields.length > 0) {
             classString = classString.slice(0, -2);
             classString += '\n';
            }

            classString += `            )\n        }\n    }\n\n`;
        }

        if (options.toJson) {
            classString += `    fun toJson(): Map<String, Any${options.nullable ? '?' : ''}> {\n`;
            classString += `        val map = mutableMapOf<String, Any?>()\n`;
            for (const field of fields) {
                let serializingLogic = field.name;
                if (field.type.startsWith('List<') && !field.type.includes('<Any>')) {
                    const listType = field.type.substring(5, field.type.length - 1);
                    if (classes.has(listType)) {
                        serializingLogic = `${field.name}?.map { it.toJson() }`;
                    }
                } else if (classes.has(field.type)) {
                    serializingLogic = `${field.name}?.toJson()`;
                }
                classString += `        map["${field.originalKey}"] = ${serializingLogic}\n`;
            }
            classString += `        return map.filterValues { it != null }\n    }\n`;
        }

        classString += `}`;
    }

    classes.set(className, classString);

    for (const key in jsonObject) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateClass(singularKey, value[0], classes, options);
            } else if (!Array.isArray(value)) {
                generateClass(toPascalCase(key), value, classes, options);
            }
        }
    }
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
    const rootJson = {...json};
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, rootJson, classes, options);

    function findJsonForClass(className: string, currentJson: any, currentName: string): any {
        if (toPascalCase(currentName) === className) {
            return currentJson;
        }

        if (typeof currentJson === 'object' && currentJson !== null) {
            for (const key in currentJson) {
                const pascalKey = toPascalCase(key);
                if (pascalKey === className) {
                    if (Array.isArray(currentJson[key])) {
                        return currentJson[key][0] ?? {};
                    }
                    return currentJson[key];
                }
                const singularPascalKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                if (singularPascalKey === className && Array.isArray(currentJson[key]) && currentJson[key].length > 0) {
                    return currentJson[key][0];
                }
                const result = findJsonForClass(className, currentJson[key], key);
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

    const generatedClassNames = Array.from(finalClasses.keys());
    const rootClassIndex = generatedClassNames.findIndex(name => name === finalRootClassName);
    
    if (rootClassIndex > -1) {
        const [rootClassName] = generatedClassNames.splice(rootClassIndex, 1);
        generatedClassNames.unshift(rootClassName);
    }
    
    return generatedClassNames.map(name => finalClasses.get(name)).join('\n\n');
}
