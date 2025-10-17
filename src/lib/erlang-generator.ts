
export interface ErlangGeneratorOptions {
    useSnakeCase?: boolean;
    includeTypes?: boolean;
    includeDefaults?: boolean;
  }
  
  const defaultOptions: ErlangGeneratorOptions = {
    useSnakeCase: true,
    includeTypes: true,
    includeDefaults: false,
  };
  
  function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }
  
  function toPascalCase(str: string): string {
    return str.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
  }

  function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }
  
  function inferErlangType(value: any): string {
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer()' : 'float()';
    if (typeof value === 'boolean') return 'boolean()';
    if (typeof value === 'string') return 'string()';
    if (Array.isArray(value)) return 'list()';
    if (typeof value === 'object' && value !== null) return 'map()';
    return 'term()';
  }
  
  function formatDefaultValue(value: any): string {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    return 'undefined';
  }
  
  function generateErlangModule(
    name: string,
    json: Record<string, any>,
    options: ErlangGeneratorOptions,
    modules: Map<string, string>
  ) {
    const recordName = (options.useSnakeCase ? toSnakeCase(name) : toCamelCase(name)).toLowerCase();
    if (modules.has(recordName)) return;
  
    const records: string[] = [];
    const types: string[] = [];
  
    for (const [key, value] of Object.entries(json)) {
      const fieldName = options.useSnakeCase ? toSnakeCase(key) : toCamelCase(key);
      const type = options.includeTypes ? `%% @type ${fieldName} :: ${inferErlangType(value)}` : '';
      const defaultValue = options.includeDefaults ? ` = ${formatDefaultValue(value)}` : '';
  
      if (options.includeTypes) types.push(type);
      records.push(`${fieldName}${defaultValue}`);
  
      // handle nested structures
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedName = `${name}_${key}`;
        generateErlangModule(nestedName, value, options, modules);
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const nestedName = `${name}_${key.endsWith('s') ? key.slice(0, -1) : key}`;
        generateErlangModule(nestedName, value[0], options, modules);
      }
    }
  
    let code = `%% Generated module: ${toPascalCase(name)}\n`;  
    if (types.length) code += types.join('\n') + '\n';
    code += `-record(${recordName}, {\n    ${records.join(',\n  ')}\n  }).\n`;
  
    modules.set(recordName, code);
  }
  
  export function generateErlangCode(
    json: any,
    rootName: string = 'data_model',
    options: ErlangGeneratorOptions = defaultOptions
  ): string {
    if (typeof json !== 'object' || json === null) {
      throw new Error('Invalid JSON object');
    }
  
    const modules = new Map<string, string>();
    generateErlangModule(rootName, json, {...defaultOptions, ...options}, modules);
  
    return Array.from(modules.values()).reverse().join('\n');
  }
  
