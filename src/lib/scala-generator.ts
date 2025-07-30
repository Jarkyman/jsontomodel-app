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
  return str.replace(/(^\w|_\w)/g, m => m.replace('_', '').toUpperCase());
}

function inferScaleType(value: any): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'string') return 'String';
  if (Array.isArray(value)) return 'List[Any]';
  if (typeof value === 'object' && value !== null) return 'Map[String, Any]';
  return 'Any';
}

function formatDefaultValue(value: any): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';
  return value;
}

function normalizeClassName(name: string, useSnakeCase: boolean): string {
  return useSnakeCase ? toSnakeCase(name) : toCamelCase(name);
}

function generateScaleClass(
  name: string,
  json: Record<string, any>,
  options: ScaleGeneratorOptions,
  modules: Map<string, string>
) {
  const className = toPascalCase(options.useSnakeCase ? toSnakeCase(name) : toCamelCase(name));
  if (modules.has(className)) return;

  const fields: string[] = [];

  for (const [key, value] of Object.entries(json)) {
    const fieldName = options.useSnakeCase ? toSnakeCase(key) : toCamelCase(key);
    const type = options.includeTypes ? `: ${inferScaleType(value)}` : '';
    const defaultVal = options.defaultValues ? ` = ${formatDefaultValue(value)}` : '';

    fields.push(`val ${fieldName}${type}${defaultVal}`);

    // Handle nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      generateScaleClass(`${name}_${key}`, value, options, modules);
    }

    // Handle array of objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      generateScaleClass(`${name}_${key}`, value[0], options, modules);
    }
  }

  const classType = options.includeStruct ? 'case class' : 'class';

  const code = `${classType} ${className}(
  ${fields.join(',\n  ')}
)`;

  modules.set(className, code);
}

export function generateScaleCode(
  json: any,
  rootName: string = 'DataModel',
  options: ScaleGeneratorOptions = defaultOptions
): string {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid JSON object');
  }

  const modules = new Map<string, string>();
  generateScaleClass(rootName, json, { ...defaultOptions, ...options }, modules);

  return Array.from(modules.values()).reverse().join('\n\n');
}
