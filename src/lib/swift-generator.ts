
export interface SwiftGeneratorOptions {
    isCodable: boolean;
    useStruct: boolean;
    isEquatable: boolean;
    isHashable: boolean;
    generateCodingKeys: boolean;
    generateCustomInit: boolean;
    generateSampleData: boolean;
    isPublished: boolean;
    isMainActor: boolean;
    isCustomStringConvertible: boolean;
    dateStrategy: 'none' | 'iso8601' | 'formatted';
}

const defaultOptions: SwiftGeneratorOptions = {
    isCodable: true,
    useStruct: true,
    isEquatable: false,
    isHashable: false,
    generateCodingKeys: true,
    generateCustomInit: false,
    generateSampleData: false,
    isPublished: false,
    isMainActor: false,
    isCustomStringConvertible: false,
    dateStrategy: 'iso8601'
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

function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function getSwiftType(value: any, key: string, classes: Map<string, string>, options: SwiftGeneratorOptions): string {
    if (options.dateStrategy !== 'none' && isIsoDateString(value)) return 'Date';

    if (value === null) return options.isCodable ? 'AnyCodable' : 'Any';

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Int' : 'Double';
    if (type === 'boolean') return 'Bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return options.isCodable ? '[AnyCodable]' : '[Any]';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getSwiftType(value[0], singularKey, classes, options);
        return `[${listType}]`;
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return className;
    }
    return options.isCodable ? 'AnyCodable' : 'Any';
}

function generateSampleValue(type: string, value: any, options: SwiftGeneratorOptions, isRoot: boolean = false): string {
    if (type.startsWith('[')) {
        const itemType = type.slice(1, -1);
        if (Array.isArray(value) && value.length > 0) {
            return `[${value.map(v => generateSampleValue(itemType, v, options)).join(', ')}]`;
        }
        return '[]';
    }

    if (type === 'String') return `"${value}"`;
    if (type === 'Int' || type === 'Double') return `${value}`;
    if (type === 'Bool') return `${value}`;
    if (type === 'Date') return `Date()`; // Or parse from string
    if (type === 'AnyCodable' || type === 'Any') return `nil`;

    // For custom classes
    return `${type}.sample`;
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: SwiftGeneratorOptions): void {
    if (classes.has(className)) return;

    let classDefinition = ``;
    if (options.isMainActor) {
        classDefinition += `@MainActor\n`;
    }
    
    const typeDeclaration = options.useStruct ? 'struct' : 'class';
    let protocols: string[] = [];
    if(options.isCodable) protocols.push('Codable');
    if(options.isEquatable) protocols.push('Equatable');
    if(options.isHashable) protocols.push('Hashable');
    if(options.isCustomStringConvertible) protocols.push('CustomStringConvertible');
    if(!options.useStruct) protocols.push('ObservableObject');

    classDefinition += `${typeDeclaration} ${className}${protocols.length > 0 ? `: ${protocols.join(', ')}` : ''} {\n`;

    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    const sortedKeys = Object.keys(jsonObject).sort();
    
    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const swiftType = getSwiftType(jsonObject[key], key, classes, options);
        fields.push({ name: fieldName, type: swiftType, originalKey: key, value: jsonObject[key] });
    }

    // Sort fields alphabetically
    fields.sort((a, b) => a.name.localeCompare(b.name));

    for (const field of fields) {
        const isOptional = '?';
        const keyword = options.useStruct ? 'let' : 'var';
        let propertyWrapper = '';
        if (options.isPublished && !options.useStruct) {
            propertyWrapper = `@Published `;
        }
        
        classDefinition += `    ${propertyWrapper}${keyword} ${field.name}: ${field.type}${isOptional}\n`;
    }

    if (options.isCodable && options.generateCodingKeys) {
        const needsCodingKeys = fields.some(f => f.name !== f.originalKey);
        if (needsCodingKeys) {
            classDefinition += `\n    enum CodingKeys: String, CodingKey {\n`;
            for (const field of fields) {
                if (field.name === field.originalKey) {
                    classDefinition += `        case ${field.name}\n`;
                } else {
                    classDefinition += `        case ${field.name} = "${field.originalKey}"\n`;
                }
            }
            classDefinition += `    }\n`;
        }
    }
    
    if (options.isHashable) {
        classDefinition += `\n    func hash(into hasher: inout Hasher) {\n`;
        for (const field of fields) {
            classDefinition += `        hasher.combine(${field.name})\n`;
        }
        classDefinition += `    }\n`;
    }
    
    if (options.isCustomStringConvertible) {
        classDefinition += `\n    var description: String {\n`;
        if (fields.length > 0) {
            const descriptionFields = fields.map(f => `        ${f.name}: \\(String(describing: ${f.name}))`).join(',\n');
            classDefinition += `        return """\n`;
            classDefinition += `    ${className}(\n`;
            classDefinition += `${descriptionFields}\n`;
            classDefinition += `    )\n`;
            classDefinition += `    """\n`;
        } else {
            classDefinition += `        return "${className}()"\n`;
        }
        classDefinition += `    }\n`;
    }
    
    if (options.generateSampleData) {
        classDefinition += `\n    static var sample: ${className} {\n`;
        classDefinition += `        return ${className}(\n`;
        for (const field of fields) {
            const sampleValue = generateSampleValue(field.type, field.value, options);
            classDefinition += `            ${field.name}: ${sampleValue},\n`;
        }
        if (fields.length > 0) {
            classDefinition = classDefinition.slice(0, -2) + '\n';
        }
        classDefinition += `        )\n`;
        classDefinition += `    }\n`;
    }
    
    const equatableFields = fields.map(f => `lhs.${f.name} == rhs.${f.name}`).join(' && ');

    if (options.isEquatable) {
         if (options.useStruct) {
            classDefinition += `\n    static func == (lhs: ${className}, rhs: ${className}) -> Bool {\n`;
            classDefinition += `        return ${equatableFields || 'true'}\n`;
            classDefinition += `    }\n`;
         }
    }

    classDefinition += '}\n';

    // Add Equatable conformance for classes outside the main definition
    if (options.isEquatable && !options.useStruct) {
        classDefinition += `\nfunc == (lhs: ${className}, rhs: ${className}) -> Bool {\n`;
        classDefinition += `    return ${equatableFields || 'true'}\n`;
        classDefinition += `}\n`;
    }

    classes.set(className, classDefinition);

    for (const key of sortedKeys) {
        const value = jsonObject[key];
        const type = typeof value;
        if (type === 'object' && value !== null && !isIsoDateString(value)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                generateClass(singularKey, value[0], classes, options);
            } else if (!Array.isArray(value)) {
                generateClass(toPascalCase(key), value, classes, options);
            }
        }
    }
}

// AnyCodable helper struct needed for handling mixed types and nulls in Swift
const anyCodableStruct = `
struct AnyCodable: Codable, Equatable, Hashable {
    let value: Any

    init<T>(_ value: T?) {
        self.value = value ?? ()
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self.value = ()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            self.value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "AnyCodable value cannot be decoded")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case is Void:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: container.codingPath, debugDescription: "AnyCodable value cannot be encoded"))
        }
    }
    
    static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        switch (lhs.value, rhs.value) {
        case (is Void, is Void):
            return true
        case (let lhsValue as (any Equatable), let rhsValue as (any Equatable)):
             return lhsValue.isEqual(to: rhsValue)
        default:
            return false
        }
    }

    func hash(into hasher: inout Hasher) {
        if let hashable = value as? AnyHashable {
            hasher.combine(hashable)
        }
    }
}

extension Equatable {
    func isEqual(to other: any Equatable) -> Bool {
        guard let other = other as? Self else {
            return false
        }
        return self == other
    }
}
`;

function generateDateHandlingComment(options: SwiftGeneratorOptions): string {
    if (options.dateStrategy === 'iso8601') {
        return `// To decode dates automatically, use this with your JSONDecoder:
//
// let decoder = JSONDecoder()
// decoder.dateDecodingStrategy = .iso8601
`;
    }
    // Could add more comments for other strategies later
    return '';
}


export function generateSwiftCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: SwiftGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const rootJson = {...json};
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, rootJson, classes, options);

    const orderedClasses = Array.from(classes.keys()).reverse();
    
    const rootClassIndex = orderedClasses.indexOf(finalRootClassName);
    if (rootClassIndex > -1) {
        const [rootClass] = orderedClasses.splice(rootClassIndex, 1);
        orderedClasses.push(rootClass);
    }
    
    const allGeneratedCode = orderedClasses.reverse().map(name => classes.get(name)).join('\n');
    
    const needsAnyCodable = allGeneratedCode.includes('AnyCodable');
    const needsDateComment = allGeneratedCode.includes(': Date?');

    let header = `import Foundation\n`;
    if (options.isPublished || options.isMainActor) {
        header += `import Combine\n`;
    }

    const dateComment = needsDateComment ? generateDateHandlingComment(options) : '';

    return `${header}\n${dateComment}${allGeneratedCode}${needsAnyCodable && options.isCodable ? `\n${anyCodableStruct}`: ''}`;
}
