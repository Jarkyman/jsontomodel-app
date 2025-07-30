
export interface ElixirGeneratorOptions {
    useSnakeCase?: boolean;
    includeTypes?: boolean;
    defaultValues?: boolean;
    includeStruct?: boolean;
  }
  
  const defaultOptions: ElixirGeneratorOptions = {
    useSnakeCase: true,
    includeTypes: true,
    defaultValues: false,
    includeStruct: true,
  };
  
  function toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
  
  function toPascalCase(str: string): string {
    return str.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
  }
  
  function inferElixirType(value: any): string {
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') return 'String.t()';
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'object') return 'map';
    return 'any';
  }
  
  function formatDefaultValue(value: any): string {
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return value;
  }
  
  function generateElixirModule(
    name: string,
    json: Record<string, any>,
    options: ElixirGeneratorOptions,
    modules: Map<string, string>
  ) {
    if (modules.has(name)) return;
  
    const modName = toPascalCase(name);
    const fields: string[] = [];
    const types: string[] = [];
  
    for (const [key, value] of Object.entries(json)) {
      const field = options.useSnakeCase ? toSnakeCase(key) : key;
      const type = options.includeTypes ? `:: ${inferElixirType(value)}` : '';
      const defaultValue = options.defaultValues ? ` // default: ${formatDefaultValue(value)}` : '';
  
      fields.push(`    ${field}: nil${defaultValue}`);
      if (options.includeTypes) {
        types.push(`  @type ${field} ${type}`);
      }
  
      // handle nested object
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedName = `${name}_${key}`;
        generateElixirModule(nestedName, value, options, modules);
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const nestedName = `${name}_${key}`;
        generateElixirModule(nestedName, value[0], options, modules);
      }
    }
  
    let code = `defmodule ${modName} do\n`;
  
    if (options.includeTypes && types.length > 0) {
      code += types.join('\n') + '\n\n';
    }
  
    if (options.includeStruct) {
      code += `  defstruct [\n${fields.join(',\n')}\n  ]\n`;
    }
  
    code += `end\n`;
    modules.set(name, code);
  }
  
  export function generateElixirCode(
    json: any,
    rootName: string = 'DataModel',
    options: ElixirGeneratorOptions = defaultOptions
  ): string {
    if (typeof json !== 'object' || json === null) {
      throw new Error('Invalid JSON object');
    }
  
    const modules = new Map<string, string>();
    generateElixirModule(rootName, json, options, modules);
  
    return Array.from(modules.values()).reverse().join('\n\n');
  }
