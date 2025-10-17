
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

function toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

function inferSQLType(value: any): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'REAL';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'string') {
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? 'DATETIME' : 'VARCHAR(255)';
  }
  if (Array.isArray(value)) return 'JSON';
  if (typeof value === 'object' && value !== null) return 'INTEGER'; // foreign key
  return 'TEXT';
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
  
  // Create a queue for processing to ensure correct table creation order
  const queue: [string, any, string?, string?][] = [[rootName, json]];
  const processed = new Set<string>();

  while(queue.length > 0) {
      const [name, currentJson, parentTable, parentIdKey] = queue.shift()!;
      const baseName = finalOptions.useSnakeCase ? toSnakeCase(name) : name;
      const tableName = finalOptions.tablePrefix ? `${finalOptions.tablePrefix}${baseName}` : baseName;

      if(processed.has(tableName)) continue;
      
      const lines: string[] = [];
      const foreignKeys: string[] = [];
      const subQueue: [string, any, string?, string?][] = [];

      if(finalOptions.includePrimaryKey) {
          lines.push('  id INTEGER PRIMARY KEY AUTOINCREMENT');
      }

      const sortedKeys = Object.keys(currentJson).sort();

      for (const key of sortedKeys) {
          const value = currentJson[key];
          const fieldName = finalOptions.useSnakeCase ? toSnakeCase(key) : key;
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              const nestedName = `${name}_${key}`;
              subQueue.push([nestedName, value]);
              const fkColumn = `${fieldName}_id`;
              lines.push(`  ${fkColumn} INTEGER${finalOptions.useNotNull ? ' NOT NULL' : ''}`);
              if(finalOptions.useForeignKeys) {
                  const nestedTableNameRaw = finalOptions.useSnakeCase ? toSnakeCase(nestedName) : nestedName;
                  const nestedTableName = finalOptions.tablePrefix ? `${finalOptions.tablePrefix}${nestedTableNameRaw}` : nestedTableNameRaw;
                  foreignKeys.push(`  FOREIGN KEY (${fkColumn}) REFERENCES ${nestedTableName}(id)`);
              }
          } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
              const childName = `${name}_${key}`;
              subQueue.push([childName, value[0], tableName, 'id']);
          } else {
              const type = finalOptions.useTypeInference ? inferSQLType(value) : 'TEXT';
              const nullStr = finalOptions.useNotNull ? ' NOT NULL' : '';
              const defaultStr = finalOptions.defaultValues ? (
                  typeof value === 'number' ? ` DEFAULT ${value}` :
                  typeof value === 'boolean' ? ` DEFAULT ${value ? 1 : 0}` :
                  typeof value === 'string' ? ` DEFAULT '${value.replace(/'/g, "''")}'` : ''
              ) : '';
              lines.push(`  ${fieldName} ${type}${nullStr}${defaultStr}`);
          }
      }

      if (parentTable) {
          const parentIdField = finalOptions.useSnakeCase ? toSnakeCase(`${parentTable}_id`) : `${parentTable}Id`;
          lines.push(`  ${parentIdField} INTEGER`);
          if (finalOptions.useForeignKeys) {
            foreignKeys.push(`  FOREIGN KEY (${parentIdField}) REFERENCES ${parentTable}(${parentIdKey || 'id'})`);
          }
      }

       if (finalOptions.includeTimestamps) {
            lines.push('  created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
            lines.push('  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        }

      const allLines = [...lines, ...foreignKeys].sort((a,b) => {
          // Keep PK first
          if (a.includes('PRIMARY KEY')) return -1;
          if (b.includes('PRIMARY KEY')) return 1;
          return a.localeCompare(b);
      });
      tables.set(tableName, `CREATE TABLE ${tableName} (\n${allLines.join(',\n')}\n);`);
      processed.add(tableName);
      queue.unshift(...subQueue);
  }

  return Array.from(tables.values()).reverse().join('\n\n');
}
