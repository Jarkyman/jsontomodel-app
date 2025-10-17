

export interface RGeneratorOptions {
    useStruct: boolean; // ignored in R, kept for parity
    defaultValues: boolean;
  }
  
  const defaultOptions: RGeneratorOptions = {
    useStruct: true,
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
  
  function getRValue(value: any, useDefault: boolean): string {
    if (!useDefault) return 'NULL';
    if (typeof value === 'string') return '""';
    if (typeof value === 'number') return '0';
    if (typeof value === 'boolean') return 'FALSE';
    if (Array.isArray(value)) return 'list()';
    if (typeof value === 'object' && value !== null) return 'list()';
    return 'NULL';
  }
  
  function generateConstructor(name: string, json: Record<string, any>, options: RGeneratorOptions): string {
    const params: string[] = [];
    const assignments: string[] = [];
    const functionName = toSnakeCase(name);
  
    const sortedKeys = Object.keys(json).sort();

    for (const key of sortedKeys) {
      const value = json[key];
      const rKey = toSnakeCase(key);
      const defaultValue = getRValue(value, options.defaultValues);
      params.push(`${rKey} = ${defaultValue}`);
      assignments.push(`${rKey} = ${rKey}`);
    }
  
    const body = `  structure(list(${assignments.join(', ')}), class = "${toPascalCase(name)}")`;
  
    return `new_${functionName} <- function(${params.join(', ')}) {\n${body}\n}`;
  }
  
  export function generateRCode(
    json: any,
    rootName: string = "DataModel",
    options: RGeneratorOptions = defaultOptions
  ): string {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      throw new Error('Invalid JSON object');
    }
  
    const queue: [string, Record<string, any>][] = [];
    const seen = new Set<string>();
  
    function traverse(obj: any, name: string) {
        if (typeof obj !== 'object' || obj === null || seen.has(name)) return;
        
        seen.add(name);
        queue.push([name, obj]);

        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const childName = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
                traverse(value[0], childName);
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                const childName = toPascalCase(key);
                traverse(value, childName);
            }
        }
    }
    
    traverse(json, rootName);

    const finalConstructors = new Map<string, string>();
    for(const [name, obj] of queue) {
      finalConstructors.set(name, generateConstructor(name, obj, options));
    }
  
    return Array.from(finalConstructors.values()).reverse().join('\n\n');
  }
  
  export { defaultOptions };
  
