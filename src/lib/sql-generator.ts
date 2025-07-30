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
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
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
    parent?: string
  ) {
    const tableName = `${options.tablePrefix || ''}${options.useSnakeCase ? toSnakeCase(name) : name}`;
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
        const nestedTable = `${name}_${key}`;
        generateSQLTable(nestedTable, value, options, tables, tableName);
        if (options.useForeignKeys) {
          lines.push(`  ${fieldName}_id INTEGER${options.useNotNull ? ' NOT NULL' : ''}`);
          foreignKeys.push(`  FOREIGN KEY (${fieldName}_id) REFERENCES ${toSnakeCase(nestedTable)}(id)`);
        }
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const nestedTable = `${name}_${key}`;
        generateSQLTable(nestedTable, value[0], options, tables, tableName);
        // arrays of objects assumed to be separate related table
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
  
    if (options.includeTimestamps) {
      lines.push('  created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      lines.push('  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    }
  
    lines.push(...foreignKeys);
  
    const sql = `CREATE TABLE ${tableName} (
  ${lines.join(',\n')}
  );`;
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
  
    const tables = new Map<string, string>();
    generateSQLTable(rootName, json, options, tables);
  
    return Array.from(tables.values()).join('\n\n');
  }
  