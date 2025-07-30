
export interface PhpGeneratorOptions {
    typedProperties: boolean;
    finalClasses: boolean;
    readonlyProperties: boolean;
    constructorPropertyPromotion: boolean;
    fromArray: boolean;
    toArray: boolean;
}

const defaultOptions: PhpGeneratorOptions = {
    typedProperties: true,
    finalClasses: true,
    readonlyProperties: true,
    constructorPropertyPromotion: true,
    fromArray: true,
    toArray: true,
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

function getPhpType(value: any, key: string, classes: Map<string, string>, options: PhpGeneratorOptions): string {
    if (value === null) return 'mixed';
    if (isIsoDateString(value)) return '\\DateTimeImmutable';
    
    const type = typeof value;
    if (type === 'string') return 'string';
    if (type === 'number') return value % 1 === 0 ? 'int' : 'float';
    if (type === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'array';
        const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const listType = getPhpType(value[0], singularKey, classes, options);
        if (listType === 'mixed' || listType === 'array') return 'array';
        return `array`; // Docblock will specify the type
    }
    if (type === 'object') {
        const className = toPascalCase(key);
        if (!classes.has(className)) {
            generateClass(className, value, classes, options);
        }
        return className;
    }
    return 'mixed';
}

function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: PhpGeneratorOptions): void {
    if (classes.has(className)) return;

    const final = options.finalClasses ? 'final ' : '';
    let classString = `<?php\n\ndeclare(strict_types=1);\n\n`;
    classString += `${final}class ${className}\n{\n`;

    const fields: { name: string, type: string, originalKey: string, value: any }[] = [];
    for (const key in jsonObject) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const phpType = getPhpType(jsonObject[key], key, classes, options);
        fields.push({ name: fieldName, type: phpType, originalKey: key, value: jsonObject[key] });
    }

    if (options.constructorPropertyPromotion) {
        classString += `    public function __construct(\n`;
        for (const field of fields) {
            const readonly = options.readonlyProperties ? 'public readonly ' : 'public ';
            const nullable = field.value === null ? '?' : '';
            const type = options.typedProperties ? `${nullable}${field.type}` : '';
            classString += `        ${readonly}${type} $${field.name},\n`;
        }
        if (fields.length > 0) {
            classString = classString.slice(0, -2); // Remove last comma and newline
        }
        classString += `\n    ) {}\n`;
    } else {
        // Traditional properties and constructor
        for (const field of fields) {
            const readonly = options.readonlyProperties ? 'readonly ' : '';
            const nullable = field.value === null ? '?' : '';
            const type = options.typedProperties ? `${nullable}${field.type}` : 'mixed';
            classString += `    public ${readonly}${type} $${field.name};\n`;
        }
        classString += `\n    public function __construct(array $data)\n    {\n`;
        for (const field of fields) {
            classString += `        $this->${field.name} = $data['${field.originalKey}'];\n`;
        }
        classString += `    }\n`;
    }

    // fromArray method
    if (options.fromArray) {
        classString += `\n    public static function fromArray(array $data): self\n    {\n`;
        classString += `        return new self(\n`;
        for (const field of fields) {
            const key = field.originalKey;
            const fieldName = field.name;
            const fieldType = field.type;
            const value = field.value;

            let parsingLogic = `$data['${key}']`;
            if (fieldType === '\\DateTimeImmutable') {
                 parsingLogic = `$data['${key}'] ? new \\DateTimeImmutable($data['${key}']) : null`;
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const singularType = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                parsingLogic = `array_map(fn($item) => ${singularType}::fromArray($item), $data['${key}'])`;
            } else if (typeof value === 'object' && value !== null) {
                 parsingLogic = `$data['${key}'] ? ${fieldType}::fromArray($data['${key}']) : null`;
            }

            classString += `            ${options.constructorPropertyPromotion ? '' : `/* ${fieldName}: */ `}${parsingLogic},\n`;
        }
        if (fields.length > 0) {
            classString = classString.slice(0, -2);
        }
        classString += `\n        );\n    }\n`;
    }

    // toArray method
    if (options.toArray) {
        classString += `\n    public function toArray(): array\n    {\n        return [\n`;
        for (const field of fields) {
             const key = field.originalKey;
             const fieldName = field.name;
             const value = field.value;

             let serializingLogic = `$this->${fieldName}`;
             if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                 serializingLogic = `array_map(fn($item) => $item->toArray(), $this->${fieldName})`;
             } else if (typeof value === 'object' && value !== null) {
                 serializingLogic = `$this->${fieldName}?->toArray()`;
             } else if (field.type === '\\DateTimeImmutable') {
                 serializingLogic = `$this->${fieldName}?->format(DateTimeInterface::ATOM)`;
             }

            classString += `            '${key}' => ${serializingLogic},\n`;
        }
        classString += `        ];\n    }\n`;
    }

    classString += '}\n';

    // Store the main class first
    classes.set(className, classString);

    // Generate dependent classes
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


export function generatePhpCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: PhpGeneratorOptions = defaultOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const finalRootClassName = toPascalCase(rootClassName);

    generateClass(finalRootClassName, { ...json }, classes, options);
    
    const orderedClasses = Array.from(classes.keys()).reverse();

    // The first class in the file should not start with <?php
    const classDefs = orderedClasses.map((name, index) => {
        const code = classes.get(name) || '';
        if (index > 0) {
            return code.replace(/<\?php\s*\n\ndeclare\(strict_types=1\);\s*\n\n/, '');
        }
        return code;
    });

    return classDefs.join('\n');
}

    