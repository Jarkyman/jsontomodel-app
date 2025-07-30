export interface RGeneratorOptions {
    useStruct: boolean; // ignored in R, kept for parity
    defaultValues: boolean;
  }
  
  const defaultOptions: RGeneratorOptions = {
    useStruct: true,
    defaultValues: false,
  };
  
  function toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
  
  function getRValue(value: any, useDefault: boolean): string {
    if (!useDefault) return 'NULL';
    if (typeof value === 'string') return '""';
    if (typeof value === 'number') return '0';
    if (typeof value === 'boolean') return 'FALSE';
    if (Array.isArray(value)) return 'list()';
    if (typeof value === 'object') return 'list()';
    return 'NULL';
  }
  
  function generateConstructor(name: string, json: Record<string, any>, options: RGeneratorOptions): string {
    const params: string[] = [];
    const assignments: string[] = [];
  
    for (const key in json) {
      const value = json[key];
      const rKey = toSnakeCase(key);
      const defaultValue = getRValue(value, options.defaultValues);
      params.push(`${rKey} = ${defaultValue}`);
      assignments.push(`${rKey} = ${rKey}`);
    }
  
    const body = `  structure(list(${assignments.join(', ')}), class = "${name}")`;
  
    return `new_${name.toLowerCase()} <- function(${params.join(', ')}) {
  ${body}
  }
  `;
  }
  
  function generateRCode(
    json: any,
    rootName: string = "DataModel",
    options: RGeneratorOptions = defaultOptions
  ): string {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      throw new Error('Invalid JSON object');
    }
  
    const generated: string[] = [];
    const queue: [string, Record<string, any>][] = [[rootName, json]];
    const seen = new Set<string>();
  
    while (queue.length > 0) {
      const [name, obj] = queue.shift()!;
      if (seen.has(name)) continue;
      seen.add(name);
  
      for (const key in obj) {
        const value = obj[key];
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          queue.push([capitalizeSingular(key), value[0]]);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          queue.push([capitalize(key), value]);
        }
      }
  
      generated.push(generateConstructor(name, obj, options));
    }
  
    return generated.reverse().join('\n');
  }
  
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  function capitalizeSingular(str: string): string {
    return capitalize(str.endsWith('s') ? str.slice(0, -1) : str);
  }
  
  export { generateRCode, defaultOptions };
  