

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

function getPhpType(value: any, key: string, classes: Map<string, string>, options: PhpGeneratorOptions): { type: string, isObject: boolean, isObjectArray: boolean } {
    let isObject = false;
    let isObjectArray = false;
    let type: string;

    if (value === null) {
        type = 'mixed';
    } else if (isIsoDateString(value)) {
        type = '\\DateTimeInterface';
    } else {
        const valueType = typeof value;
        if (valueType === 'string') {
            type = 'string';
        } else if (valueType === 'number') {
            type = value % 1 === 0 ? 'int' : 'float';
        } else if (valueType === 'boolean') {
            type = 'bool';
        } else if (Array.isArray(value)) {
            type = 'array';
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                isObjectArray = true;
            }
        } else if (valueType === 'object') {
            const className = toPascalCase(key);
            if (!classes.has(className)) {
                generateClass(className, value, classes, options);
            }
            type = className;
            isObject = true;
        } else {
            type = 'mixed';
        }
    }
    return { type, isObject, isObjectArray };
}

function generateClass(className: string, jsonObject: Record<string, any>, classes: Map<string, string>, options: PhpGeneratorOptions): void {
    if (classes.has(className)) return;

    const final = options.finalClasses ? 'final ' : '';
    const implementsClause = options.toArray ? ' implements \\JsonSerializable' : '';
    let classString = `<?php\n\ndeclare(strict_types=1);\n\n`;
    classString += `${final}class ${className}${implementsClause}\n{\n`;

    const fields: { name: string, type: string, originalKey: string, isObject: boolean, isObjectArray: boolean }[] = [];
    const sortedKeys = Object.keys(jsonObject).sort();
    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toCamelCase(key);
        const { type: phpType, isObject, isObjectArray } = getPhpType(jsonObject[key], key, classes, options);
        fields.push({ name: fieldName, type: phpType, originalKey: key, isObject, isObjectArray });
    }

    fields.sort((a, b) => a.name.localeCompare(b.name));

    if (options.constructorPropertyPromotion) {
        
        const docBlockParams = fields
            .filter(field => field.isObjectArray)
            .map(field => {
                const singularType = toPascalCase(field.originalKey.endsWith('s') ? field.originalKey.slice(0, -1) : field.originalKey);
                return `     * @param ${singularType}[]|null $${field.name}`;
            });

        if (docBlockParams.length > 0) {
            classString += `    /**\n${docBlockParams.join('\n')}\n     */\n`;
        }
        
        classString += `    public function __construct(\n`;
        const constructorParams = fields.map(field => {
            const readonly = options.readonlyProperties ? 'public readonly ' : 'public ';
            let typeHint = '';
            if (options.typedProperties) {
                // For 'mixed' or arrays of objects, 'array' is the best we can do for a type hint.
                const type = (field.isObjectArray || field.type === 'mixed') ? (field.type === 'array' ? 'array' : 'mixed') : field.type;
                typeHint = field.type !== 'mixed' ? `?${type}` : 'mixed';
            }
            
            if (field.isObjectArray && !docBlockParams.some(p => p.includes(`$${field.name}`))) {
                 const singularType = toPascalCase(field.originalKey.endsWith('s') ? field.originalKey.slice(0, -1) : field.originalKey);
                 return `        /** @var ${singularType}[]|null */\n        ${readonly}${typeHint} $${field.name}`;
            }

            return `        ${readonly}${typeHint} $${field.name}`;
        });

        classString += constructorParams.join(',\n');
        classString += `\n    ) {}\n`;

    } else {
        // Traditional properties and constructor
        for (const field of fields) {
            const readonly = options.readonlyProperties ? 'readonly ' : '';
            const type = options.typedProperties ? `?${field.type}` : '';

            if (field.isObjectArray) {
                const singularType = toPascalCase(field.originalKey.endsWith('s') ? field.originalKey.slice(0, -1) : field.originalKey);
                classString += `    /** @var ${singularType}[]|null */\n`;
            }
            classString += `    public ${readonly}${type} $${field.name};\n`;
        }
        classString += `\n    public function __construct(array $data)\n    {\n`;
        for (const field of fields) {
             const key = field.originalKey;
             const {parsingLogic} = getParsingLogic(field, key, options, 'data');
             classString += `        $this->${field.name} = ${parsingLogic};\n`;
        }
        classString += `    }\n`;
    }

    // fromArray method
    if (options.fromArray) {
        classString += `\n    public static function fromArray(array $data): self\n    {\n`;
        if (options.constructorPropertyPromotion) {
            classString += `        return new self(\n`;
            const fromArrayParams = fields.map(field => {
                const key = field.originalKey;
                const { parsingLogic } = getParsingLogic(field, key, options, 'data');
                return `            ${parsingLogic}`;
            });
            classString += fromArrayParams.join(',\n');
            classString += `\n        );\n    }\n`;
        } else {
             classString += `        return new self($data);\n    }\n`;
        }
    }

    // toArray method
    if (options.toArray) {
        classString += `\n    public function toArray(): array\n    {\n        return [\n`;
        for (const field of fields) {
             const key = field.originalKey;
             const { serializingLogic } = getSerializingLogic(field);
             classString += `            '${key}' => ${serializingLogic},\n`;
        }
        classString += `        ];\n    }\n`;

        classString += `\n    public function jsonSerialize(): mixed\n    {\n        return $this->toArray();\n    }\n`;
    }

    classString += '}\n';

    classes.set(className, classString);

    // Generate dependent classes
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

function getParsingLogic(field: { name: string, type: string, originalKey: string, isObject: boolean, isObjectArray: boolean }, key: string, options: PhpGeneratorOptions, dataVar: string = 'data') {
    let parsingLogic: string;
    
    if (field.type === '\\DateTimeInterface') {
        parsingLogic = `isset($${dataVar}['${key}']) ? new \\DateTimeImmutable($${dataVar}['${key}']) : null`;
    } else if (field.isObjectArray) {
        const singularType = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        const mapLogic = `fn($item) => ${singularType}::fromArray($item)`;
        parsingLogic = `is_array($${dataVar}['${key}'] ?? null) ? array_map(${mapLogic}, $${dataVar}['${key}']) : null`;
    } else if (field.isObject) {
        const fromArrayLogic = `${field.type}::fromArray($${dataVar}['${key}'])`;
        const constructorLogic = `new ${field.type}($${dataVar}['${key}'])`;
        const instantiation = options.fromArray ? fromArrayLogic : constructorLogic;
        parsingLogic = `isset($${dataVar}['${key}']) ? ${instantiation} : null`;
    } else {
        parsingLogic = `$${dataVar}['${key}'] ?? null`;
    }
    return { parsingLogic };
}

function getSerializingLogic(field: { name: string, type: string, isObject: boolean, isObjectArray: boolean }) {
    let serializingLogic = `$this->${field.name}`;
    if (field.isObjectArray) {
        serializingLogic = `isset($this->${field.name}) ? array_map(fn($item) => $item->toArray(), $this->${field.name}) : null`;
    } else if (field.isObject) {
        serializingLogic = `$this->${field.name}?->toArray()`;
    } else if (field.type === '\\DateTimeInterface') {
        serializingLogic = `$this->${field.name}?->format(\\DateTimeInterface::ATOM)`;
    }
    return { serializingLogic };
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

    const classDefs = orderedClasses.map((name, index) => {
        let code = classes.get(name) || '';
        
        const needsInterface = code.includes('?->format(\\DateTimeInterface::ATOM)');

        if (needsInterface && !code.includes('use DateTimeInterface;')) {
             code = code.replace('<?php', '<?php\n\nuse DateTimeInterface;');
        }

        if (index > 0) {
            return code.replace(/<\?php\s*\n\n(use\s+DateTimeInterface;\s*\n\n)?declare\(strict_types=1\);\s*\n\n/, '');
        }
        return code;
    });

    return classDefs.join('\n');
}
