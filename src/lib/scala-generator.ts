export interface ScaleGeneratorOptions {
    useSnakeCase?: boolean;
    includeTypes?: boolean;
    defaultValues?: boolean;
    includeStruct?: boolean; // For symmetry with other generators
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
  
  function inferScaleType(value: any): string {
    if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float';
    if (typeof value === 'boolean') return 'Boolean';
    if (typeof value === 'string') return 'String';
    if (Array.isArray(value)) return 'List';
    if (typeof value === 'object') return 'Map';
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
    const className = options.useSnakeCase ? toSnakeCase(name) : name;
    if (modules.has(className)) return;
  
    const fields: string[] = [];
    const types: string[] = [];
  
    for (const [key, value] of Object.entries(json)) {
      const fieldName = options.useSnakeCase ? toSnakeCase(key) : toCamelCase(key);
      const type = options.includeTypes ? inferScaleType(value) : '';
      const defaultVal = options.defaultValues ? ` = ${formatDefaultValue(value)}` : '';
  
      if (options.includeTypes) {
        types.push(`val ${fieldName}: ${type}${defaultVal}`);
      } else {
        fields.push(`val ${fieldName}${defaultVal}`);
      }
  
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        generateScaleClass(`${name}_${key}`, value, options, modules);
      }
  
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        generateScaleClass(`${name}_${key}`, value[0], options, modules);
      }
    }
  
    const body = options.includeTypes ? types : fields;
  
    const code = `class ${className}(
    ${body.map(f => f).join(',\n  ')}
  )
  `;
  
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
  