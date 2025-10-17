
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

// Better snake_case converter: handles camelCase, PascalCase, and mixed cases
function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')  // handle camelCase boundaries
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2') // handle ABCDef => ABC_Def
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
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
  return value.toString();
}

function generateElixirModule(
  name: string,
  json: Record<string, any>,
  options: ElixirGeneratorOptions,
  modules: Map<string, string>
) {
  const moduleName = toPascalCase(name); // Always PascalCase for module names

  if (modules.has(moduleName)) return;

  const fields: string[] = [];
  const types: string[] = [];

  const sortedKeys = Object.keys(json).sort();

  for (const rawKey of sortedKeys) {
    const value = json[rawKey];
    const fieldName = options.useSnakeCase ? toSnakeCase(rawKey) : toCamelCase(rawKey);
    const typeName = options.useSnakeCase ? toSnakeCase(rawKey) : toCamelCase(rawKey);

    const type = options.includeTypes ? `:: ${inferElixirType(value)}` : '';
    const defaultValue = options.defaultValues ? ` # default: ${formatDefaultValue(value)}` : '';

    if (options.includeStruct) {
      fields.push(`    ${fieldName}: nil${defaultValue}`);
    }

    if (options.includeTypes) {
      types.push(`  @type ${typeName} ${type}`);
    }

    // Handle nested object
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedModuleName = `${name}_${rawKey}`;
      generateElixirModule(nestedModuleName, value, options, modules);
    }

    // Handle array of objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const nestedModuleName = `${name}_${rawKey.endsWith('s') ? rawKey.slice(0, -1) : rawKey}`;
      generateElixirModule(nestedModuleName, value[0], options, modules);
    }
  }

  let code = `defmodule ${moduleName} do\n`;

  if (types.length > 0) {
    code += types.join('\n') + '\n\n';
  }

  if (fields.length > 0) {
    code += `  defstruct [\n${fields.join(',\n')}\n  ]\n`;
  } else if (!options.includeStruct && types.length === 0) {
    code += `  # Module generated for ${moduleName}\n`;
  }

  code += `end`;
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

  const finalOptions = { ...defaultOptions, ...options };

  if (Object.keys(json).length === 0) {
    let emptyModule = `defmodule ${toPascalCase(rootName)} do`;
    if (!finalOptions.includeStruct && !finalOptions.includeTypes) {
        emptyModule += `\n  # Module generated for ${toPascalCase(rootName)}\nend`;
    } else {
        emptyModule += `\nend`;
    }
    return emptyModule;
  }

  const modules = new Map<string, string>();
  generateElixirModule(rootName, json, finalOptions, modules);

  return Array.from(modules.values()).reverse().join('\n\n');
}
