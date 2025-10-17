
export interface ScaleGeneratorOptions {
  useSnakeCase?: boolean;
  includeTypes?: boolean;
  defaultValues?: boolean;
  includeStruct?: boolean; // Means case class if true
}

const defaultOptions: ScaleGeneratorOptions = {
  useSnakeCase: true,
  includeTypes: true,
  defaultValues: false,
  includeStruct: true,
};

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function inferScaleType(value: any, key: string, options: ScaleGeneratorOptions, classes: Set<string>): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'string') return 'String';
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const listType = inferScaleType(value[0], key.endsWith('s') ? key.slice(0, -1) : key, options, classes);
      return `List[${listType}]`;
    }
    return 'List[Any]';
  }
  if (typeof value === 'object' && value !== null) {
      const nestedClassName = toPascalCase(key);
      classes.add(nestedClassName);
      return nestedClassName;
  }
  return 'Any';
}


function formatDefaultValue(value: any): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';
  return value;
}


function generateScaleClass(
  name: string,
  json: Record<string, any>,
  options: ScaleGeneratorOptions,
  modules: Map<string, string>
) {
  const className = toPascalCase(name);
  if (modules.has(className)) return;

  const fields: string[] = [];
  const nestedClasses = new Set<string>();

  const sortedKeys = Object.keys(json).sort();

  for (const key of sortedKeys) {
    const value = json[key];
    const fieldName = options.useSnakeCase ? toSnakeCase(key) : toCamelCase(key);
    let type = '';
    if (options.includeTypes) {
      type = `: ${inferScaleType(value, key, options, nestedClasses)}`;
    }
    
    const defaultVal = options.defaultValues ? ` = ${formatDefaultValue(value)}` : '';
    
    if (options.includeStruct) {
        fields.push(`val ${fieldName}${type}${defaultVal}`);
    }
  }

  const classType = options.includeStruct ? 'case class' : 'class';
  const params = fields.length > 0 ? `( ${fields.join(', ')} )` : '()';

  const code = `${classType} ${className}${params}`;
  modules.set(className, code);

  // After processing fields, recurse for nested classes that were identified
  for (const key of sortedKeys) {
      const value = json[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedClassName = toPascalCase(key);
          generateScaleClass(nestedClassName, value, options, modules);
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const nestedClassName = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
          generateScaleClass(nestedClassName, value[0], options, modules);
      }
  }
}

export function generateScaleCode(
  json: any,
  rootName: string = 'DataModel',
  options: ScaleGeneratorOptions = defaultOptions
): string {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid JSON object');
  }

  const finalOptions = { ...defaultOptions, ...options };
  const modules = new Map<string, string>();
  generateScaleClass(rootName, json, finalOptions, modules);

  return Array.from(modules.values()).reverse().join('\n\n');
}
