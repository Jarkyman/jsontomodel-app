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
  // Handles camelCase and PascalCase
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
}

function inferElixirType(value: any): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'String.t()';
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'object' && value !== null) return 'map';
  return 'any';
}

function formatDefaultValue(value: any): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'nil';
  return value;
}

function generateElixirModule(
  name: string,
  json: Record<string, any>,
  options: ElixirGeneratorOptions,
  modules: Map<string, string>
) {
  const moduleName = toPascalCase(name);

  // avoid duplicate generation
  if (modules.has(moduleName)) return;

  const fields: string[] = [];
  const types: string[] = [];

  for (const [key, value] of Object.entries(json)) {
    const fieldName = options.useSnakeCase ? toSnakeCase(key) : key;
    const typeName = options.useSnakeCase ? toSnakeCase(key) : key; // This is the fix

    const type = options.includeTypes ? `:: ${inferElixirType(value)}` : '';
    const defaultValue = options.defaultValues ? ` # default: ${formatDefaultValue(value)}` : '';

    if (options.includeStruct) {
      fields.push(`    ${fieldName}: nil${defaultValue}`);
    }

    if (options.includeTypes) {
      types.push(`  @type ${typeName} ${type}`);
    }

    // handle nested object
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedModuleName = `${name}_${key}`;
      generateElixirModule(nestedModuleName, value, options, modules);
    }

    // handle array of objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const nestedModuleName = `${name}_${key.endsWith("s") ? key.slice(0, -1) : key}`;
      generateElixirModule(nestedModuleName, value[0], options, modules);
    }
  }

  let code = `defmodule ${moduleName} do\n`;

  if (options.includeTypes && types.length > 0) {
    code += types.join('\n') + '\n\n';
  }

  if (options.includeStruct && fields.length > 0) {
    code += `  defstruct [\n${fields.join(',\n')}\n  ]\n`;
  } else if (!options.includeTypes) {
    // If no types and no struct, ensure the module is not empty
    code += `  # Module generated for ${moduleName}\n`;
  }


  code += `end\n`;

  modules.set(moduleName, code);
}

export function generateElixirCode(
  json: any,
  rootName: string = 'DataModel',
  options: ElixirGeneratorOptions = defaultOptions
): string {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid JSON object');
  }
   if (Object.keys(json).length === 0) {
    return `defmodule ${toPascalCase(rootName)} do\nend\n`;
  }

  const modules = new Map<string, string>();
  generateElixirModule(rootName, json, { ...defaultOptions, ...options }, modules);

  return Array.from(modules.values()).reverse().join('\n\n');
}
