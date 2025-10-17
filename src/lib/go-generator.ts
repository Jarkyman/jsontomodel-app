

export interface GoGeneratorOptions {
    usePointers: boolean;
    packageName: string;
    useArrayOfPointers: boolean;
}

const defaultOptions: GoGeneratorOptions = {
    usePointers: true,
    packageName: 'main',
    useArrayOfPointers: false,
};

function toPascalCase(str: string): string {
    let pascal = str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
    
    // Handle specific acronyms common in Go, especially at the end of a word.
    const acronyms = ["Id", "Url", "Api", "Json", "Html", "Http", "Https"];
    for (const acronym of acronyms) {
        if (pascal.endsWith(acronym)) {
            pascal = pascal.slice(0, -acronym.length) + acronym.toUpperCase();
        }
    }
    
    return pascal;
}

function isIsoDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function hasMixedNumberTypes(arr: any[]): boolean {
    let hasInt = false;
    let hasFloat = false;
    for (const item of arr) {
        if (typeof item === 'number') {
            if (Number.isInteger(item)) {
                hasInt = true;
            } else {
                hasFloat = true;
            }
        }
    }
    return hasInt && hasFloat;
}

function arrayContainsNull(arr: any[]): boolean {
    return arr.some(item => item === null);
}

function getGoType(value: any, key: string, structs: Set<string>, options: GoGeneratorOptions, isRecursiveCall: boolean = false): string {
    let goType: string;
    
    if (isIsoDateString(value)) {
        goType = 'time.Time';
    } else if (value === null) {
        goType = 'interface{}'; // The equivalent of 'any'
    } else {
        const type = typeof value;
        if (type === 'string') {
            goType = 'string';
        } else if (type === 'number') {
            goType = value % 1 === 0 ? 'int' : 'float64';
        } else if (type === 'boolean') {
            goType = 'bool';
        } else if (Array.isArray(value)) {
            if (value.length === 0 || arrayContainsNull(value)) {
                goType = '[]interface{}';
            } else {
                const singularKey = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                let sliceType: string;

                if (hasMixedNumberTypes(value)) {
                    sliceType = 'float64';
                } else {
                    sliceType = getGoType(value[0], singularKey, structs, options, true);
                }

                if (options.useArrayOfPointers && !sliceType.startsWith('*') && sliceType !== 'interface{}' && !sliceType.startsWith('[]')) {
                    sliceType = `*${sliceType}`;
                }

                goType = `[]${sliceType}`;
            }
        } else if (type === 'object') {
            const structName = toPascalCase(key);
            structs.add(structName);
            goType = structName;
        } else {
            goType = 'interface{}';
        }
    }
    
    if (options.usePointers && !goType.startsWith('[]') && !goType.startsWith('map[') && goType !== 'interface{}' && !isRecursiveCall) {
        if (!goType.startsWith('*')) {
            return `*${goType}`;
        }
    }

    return goType;
}

function generateStruct(structName: string, jsonObject: Record<string, any>, options: GoGeneratorOptions): { structDef: string, dependentClasses: Set<string> } {
    const dependentClasses = new Set<string>();
    let structString = `type ${structName} struct {\n`;
    const fields: { name: string, type: string, originalKey: string }[] = [];

    const sortedKeys = Object.keys(jsonObject).sort();

    for (const key of sortedKeys) {
        if (key === '') continue;
        const fieldName = toPascalCase(key);
        const goType = getGoType(jsonObject[key], key, dependentClasses, options);
        fields.push({ name: fieldName, type: goType, originalKey: key });
    }

    fields.sort((a, b) => a.name.localeCompare(b.name));

    for (const field of fields) {
        structString += `\t${field.name} ${field.type} \`json:"${field.originalKey},omitempty"\`\n`;
    }
    structString += '}\n';

    return { structDef: structString, dependentClasses };
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

export function generateGoCode(
    json: any,
    rootStructName: string = 'DataModel',
    options: GoGeneratorOptions
): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
        throw new Error("Invalid or empty JSON object provided.");
    }
    
    const classes = new Map<string, string>();
    const toProcess: { name: string, json: any }[] = [{ name: toPascalCase(rootStructName), json }];
    const processed = new Set<string>();

    while (toProcess.length > 0) {
        const { name, json: currentJson } = toProcess.shift()!;
        if (processed.has(name)) continue;

        const { structDef, dependentClasses } = generateStruct(name, currentJson, options);
        classes.set(name, structDef);
        processed.add(name);

        dependentClasses.forEach(depName => {
            const depJson = findJsonForClass(depName, json, toPascalCase(rootStructName));
            if (depJson) {
                toProcess.push({ name: depName, json: depJson });
            }
        });
    }
    
    const orderedStructs = Array.from(classes.keys()).sort((a,b) => {
        const classA = classes.get(a) || '';
        const classB = classes.get(b) || '';

        // If B's definition uses A, A should come first.
        if (classB.includes(` ${a} `) || classB.includes(`[]${a}`)) return -1;
        // If A's definition uses B, B should come first.
        if (classA.includes(` ${b} `) || classA.includes(`[]${b}`)) return 1;

        if (a === toPascalCase(rootStructName)) return 1;
        if (b === toPascalCase(rootStructName)) return -1;

        return a.localeCompare(b);
    });
    
    let allCode = orderedStructs.map(name => classes.get(name)).join('\n');

    let finalCode = `package ${options.packageName}\n\n`;
    if (allCode.includes('time.Time')) {
        finalCode += 'import "time"\n\n';
    }

    finalCode += allCode;

    return finalCode;
}
