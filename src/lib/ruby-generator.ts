export interface RubyGeneratorOptions {
    attrAccessor: boolean;
    snakeCase: boolean;
    initialize: boolean;
    defaultValues: boolean;
    useStruct: boolean;
  }
  
  const defaultOptions: RubyGeneratorOptions = {
    attrAccessor: true,
    snakeCase: true,
    initialize: true,
    defaultValues: false,
    useStruct: false,
  };
  
  function toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[-\s]/g, '_')
      .toLowerCase();
  }
  
  function toPascalCase(str: string): string {
    return str.replace(/(?:^|_|-)(\w)/g, (_, c) => c.toUpperCase());
  }
  
  function getRubyType(value: any): string {
    if (value === null || value === undefined) return 'Object';
    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return Number.isInteger(value) ? 'Integer' : 'Float';
    if (type === 'boolean') return 'Boolean';
    if (Array.isArray(value)) return 'Array';
    if (type === 'object') return 'Object';
    return 'Object';
  }
  
  function generateRubyClass(
    className: string,
    jsonObject: Record<string, any>,
    classes: Map<string, string>,
    options: RubyGeneratorOptions
  ): void {
    if (classes.has(className)) return;
  
    const fieldLines: string[] = [];
    const attrNames: string[] = [];
    const initLines: string[] = [];
    const args: string[] = [];
  
    for (const key in jsonObject) {
      if (key === '') continue;
      const name = options.snakeCase ? toSnakeCase(key) : key;
      attrNames.push(`:${name}`);
      if (options.defaultValues) {
        initLines.push(`    @${name} = ${name} || nil`);
        args.push(`${name} = nil`);
      } else {
        initLines.push(`    @${name} = ${name}`);
        args.push(name);
      }
    }
  
    let classDef = `class ${className}\n`;
  
    if (options.useStruct) {
      classDef = `${className} = Struct.new(${attrNames.join(', ')})\n`;
    } else {
      if (options.attrAccessor) {
        classDef += `  attr_accessor ${attrNames.join(', ')}\n`;
      }
      if (options.initialize) {
        classDef += `\n  def initialize(${args.join(', ')})\n`;
        classDef += initLines.join('\n') + '\n  end\n';
      }
      classDef += `end\n`;
    }
  
    classes.set(className, classDef);
  
    for (const key in jsonObject) {
      const value = jsonObject[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        generateRubyClass(toPascalCase(key), value, classes, options);
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const singular = toPascalCase(key.endsWith('s') ? key.slice(0, -1) : key);
        generateRubyClass(singular, value[0], classes, options);
      }
    }
  }
  
  export function generateRubyCode(
    json: any,
    rootClassName: string = 'DataModel',
    options: RubyGeneratorOptions = defaultOptions
  ): string {
    if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
      throw new Error('Invalid or empty JSON object');
    }
  
    const classes = new Map<string, string>();
    const pascalName = toPascalCase(rootClassName);
    generateRubyClass(pascalName, json, classes, options);
  
    return Array.from(classes.values()).reverse().join('\n\n');
  }
  