
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

    if (value === null) return 'AnyCodable';

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return value % 1 === 0 ? 'Int' : 'Double';
    if (type === 'boolean') return 'Bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return '[AnyCodable]';
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
    return 'AnyCodable';
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
    if (type === 'AnyCodable') return `nil`;

    // For custom classes
    return `${type}.sample`;
}


function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: SwiftGeneratorOptions): void {
    if (classes.has(className)) return;

    let classString = ``;
    if (options.isMainActor) {
        classString += `@MainActor\n`;
    }
    
    const typeDeclaration = options.useStruct ? 'struct' : 'class';
    let protocols: string[] = [];
    if(options.isCodable) protocols.push('Codable');
    if(options.isEquatable) protocols.push('Equatable');
    if(options.isHashable) protocols.push('Hashable');
    if(options.isCustomStringConvertible) protocols.push('CustomStringConvertible');
    if(!options.useStruct) protocols.push('ObservableObject');

    classString += `${typeDeclaration} ${className}${protocols.length > 0 ? `: ${protocols.join(', ')}` : ''} {\n`;

    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const swiftType = getSwiftType(jsonObject[key], key, classes, options);
        
        const isOptional = swiftType.includes('AnyCodable') ? '' : '?';
        const keyword = options.useStruct ? 'let' : 'var';
        let propertyWrapper = '';
        if (options.isPublished && !options.useStruct) {
            propertyWrapper = `@Published `;
        }
        
        classString += `    ${propertyWrapper}${keyword} ${fieldName}: ${swiftType}${isOptional}\n`;
        fields.push({ name: fieldName, type: swiftType, originalKey: key, value: jsonObject[key] });
    }

    if (options.isCodable && options.generateCodingKeys) {
        // Only generate CodingKeys if at least one field name differs from its original key
        const needsCodingKeys = fields.some(f => f.name !== f.originalKey);
        if (needsCodingKeys) {
            classString += `\n    enum CodingKeys: String, CodingKey {\n`;
            for (const field of fields) {
                if (field.name === field.originalKey) {
                    classString += `        case ${field.name}\n`;
                } else {
                    classString += `        case ${field.name} = "${field.originalKey}"\n`;
                }
            }
            classString += `    }\n`;
        }
    }
    
    if (options.isCustomStringConvertible) {
        classString += `\n    var description: String {\n`;
        const descriptionFields = fields.map(f => `\\(${f.name} ?? "nil")`).join(', ');
        classString += `        return "${className}(${fields.map(f => `${f.name}: \\(${f.name} ?? "nil")`).join(', ')})"\n`;
        classString += `    }\n`;
    }
    
    if (options.generateSampleData) {
        classString += `\n    static var sample: ${className} {\n`;
        classString += `        return ${className}(\n`;
        for (const field of fields) {
            const sampleValue = generateSampleValue(field.type, field.value, options);
            classString += `            ${field.name}: ${sampleValue},\n`;
        }
        classString += `        )\n`;
        classString += `    }\n`;
    }

    classString += '}\n';
    classes.set(className, classString);

    for (const key in jsonObject) {
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

    function findJsonForClass(className: string, currentJson: any, currentName: string): any {
        if (toPascalCase(currentName) === className) {
            return currentJson;
        }

        if (typeof currentJson === 'object' && currentJson !== null) {
            for (const key in currentJson) {
                const value = currentJson[key];
                 if (isIsoDateString(value)) continue;

                const pascalKey = toPascalCase(key);
                if (pascalKey === className) {
                    if (Array.isArray(value)) {
                        return value[0] ?? {};
                    }
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

    const generatedClassNames = Array.from(finalClasses.keys());
    const rootClassIndex = generatedClassNames.findIndex(name => name === finalRootClassName);
    
    if (rootClassIndex > -1) {
        const [rootClassName] = generatedClassNames.splice(rootClassIndex, 1);
        generatedClassNames.unshift(rootClassName);
    }
    
    const needsAnyCodable = Array.from(finalClasses.values()).some(code => code.includes('AnyCodable'));
    const needsDateComment = Array.from(finalClasses.values()).some(code => code.includes('let createdAt: Date?'));
    
    const finalCode = generatedClassNames.map(name => finalClasses.get(name)).join('\n');

    let header = `import Foundation\n`;
    if (options.isPublished || options.isMainActor) {
        header += `import Combine\n`;
    }

    const dateComment = needsDateComment ? generateDateHandlingComment(options) : '';

    return `${header}\n${dateComment}${finalCode}${needsAnyCodable ? `\n${anyCodableStruct}`: ''}`;
}
