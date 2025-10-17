
export interface SQLGeneratorOptions {
  tablePrefix?: string;
  useSnakeCase?: boolean;
  includePrimaryKey?: boolean;
  useNotNull?: boolean;
  includeTimestamps?: boolean;
  useForeignKeys?: boolean;
  useTypeInference?: boolean;
  defaultValues?: boolean;
}

const defaultOptions: SQLGeneratorOptions = {
  tablePrefix: '',
  useSnakeCase: true,
  includePrimaryKey: true,
  useNotNull: true,
  includeTimestamps: false,
  useForeignKeys: true,
  useTypeInference: true,
  defaultValues: false,
};

function toSnakeCase(str: string): string {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
        .toLowerCase();
}

function inferSQLType(value: any): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'REAL';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'string') {
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? 'DATETIME' : 'VARCHAR(255)';
  }
  if (Array.isArray(value)) return 'JSON';
  if (typeof value === 'object') return 'INTEGER'; // foreign key
  return 'TEXT';
}

function generateSQLTable(
  name: string,
  json: Record<string, any>,
  options: SQLGeneratorOptions,
  tables: Map<string, string>,
  parentTableName?: string,
  parentIdKey?: string
) {
  const baseName = options.useSnakeCase ? toSnakeCase(name) : name;
  const tableName = options.tablePrefix ? `${options.tablePrefix}${baseName}` : baseName;

  if (tables.has(tableName)) return;

  const lines: string[] = [];
  const foreignKeys: string[] = [];

  if (options.includePrimaryKey) {
    lines.push('  id INTEGER PRIMARY KEY AUTOINCREMENT');
  }

  for (const [key, value] of Object.entries(json)) {
    const fieldName = options.useSnakeCase ? toSnakeCase(key) : key;
    let type = 'TEXT';
    if (options.useTypeInference) type = inferSQLType(value);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedName = `${name}_${key}`;
      const nestedTableName = `${options.tablePrefix || ''}${options.useSnakeCase ? toSnakeCase(nestedName) : nestedName}`;
      generateSQLTable(nestedName, value, options, tables);

      if (options.useForeignKeys) {
        lines.push(`  ${fieldName}_id INTEGER${options.useNotNull ? ' NOT NULL' : ''}`);
        foreignKeys.push(`  FOREIGN KEY (${fieldName}_id) REFERENCES ${nestedTableName}(id)`);
      }
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
      const nestedName = `${name}_${singularKey}`;
      generateSQLTable(nestedName, value[0], options, tables, tableName, 'id');
    } else {
      const nullStr = options.useNotNull ? ' NOT NULL' : '';
      const defaultStr = options.defaultValues
        ? typeof value === 'number'
          ? ` DEFAULT ${value}`
          : typeof value === 'boolean'
          ? ` DEFAULT ${value ? 1 : 0}`
          : typeof value === 'string'
          ? ` DEFAULT '${value}'`
          : ''
        : '';

      lines.push(`  ${fieldName} ${type}${nullStr}${defaultStr}`);
    }
  }
  
  if (parentTableName && options.useForeignKeys) {
      const parentIdField = options.useSnakeCase ? toSnakeCase(`${parentTableName}_id`) : `${parentTableName}Id`;
      lines.push(`  ${parentIdField} INTEGER`);
      foreignKeys.push(`  FOREIGN KEY (${parentIdField}) REFERENCES ${parentTableName}(${parentIdKey || 'id'})`);
  }

  if (options.includeTimestamps) {
    lines.push('  created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    lines.push('  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
  }

  lines.push(...foreignKeys);

  const sql = `CREATE TABLE ${tableName} (\n${lines.join(',\n')}\n);`;
  tables.set(tableName, sql);
}

export function generateSQLSchema(
  json: any,
  rootName: string,
  options: SQLGeneratorOptions = defaultOptions
): string {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid JSON data');
  }
  
  const finalOptions = { ...defaultOptions, ...options };
  const tables = new Map<string, string>();
  const rootTableName = finalOptions.useSnakeCase ? toSnakeCase(rootName) : rootName;
  generateSQLTable(rootTableName, json, finalOptions, tables);

  return Array.from(tables.values()).join('\n\n');
}
