
export interface ObjCGeneratorOptions {
    properties: boolean;        // Use @property declarations
    initializers: boolean;      // Generate -initWith... method
    nullability: boolean;       // Annotate with nullable/nonnull
    snakeCase: boolean;         // Convert snake_case to camelCase
    rootClassPrefix: string;    // Optional prefix like "DM"
  }
  
  const defaultOptions: ObjCGeneratorOptions = {
    properties: true,
    initializers: true,
    nullability: true,
    snakeCase: true,
    rootClassPrefix: "",
  };
  
  function toPascalCase(str: string): string {
    return str.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
  }
  
  function toCamelCase(str: string): string {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
  
  function getObjCType(value: any): string {
    if (value === null) return 'id';
    if (typeof value === 'string') return 'NSString *';
    if (typeof value === 'number') return Number.isInteger(value) ? 'NSNumber *' : 'NSNumber *';
    if (typeof value === 'boolean') return 'NSNumber *';
    if (Array.isArray(value)) return 'NSArray *';
    if (typeof value === 'object') return 'NSObject *';
    return 'id';
  }
  
  function generateClass(
    className: string,
    jsonObject: Record<string, any>,
    classes: Map<string, string>,
    options: ObjCGeneratorOptions
  ) {
    if (classes.has(className)) return;
  
    const fields: { key: string; type: string; objcName: string }[] = [];
  
    for (const key in jsonObject) {
      if (!key) continue;
      const rawValue = jsonObject[key];
      const objcName = options.snakeCase ? toCamelCase(key) : key;
      let type = getObjCType(rawValue);
  
      // Custom class handling
      if (typeof rawValue === 'object' && rawValue !== null) {
        const nestedClassName = toPascalCase(key);
        generateClass(nestedClassName, rawValue, classes, options);
        type = `${options.rootClassPrefix}${nestedClassName} *`;
      } else if (Array.isArray(rawValue) && rawValue.length > 0 && typeof rawValue[0] === 'object') {
        const nestedClassName = toPascalCase(key.endsWith("s") ? key.slice(0, -1) : key);
        generateClass(nestedClassName, rawValue[0], classes, options);
        type = `NSArray<${options.rootClassPrefix}${nestedClassName} *> *`;
      }
  
      fields.push({ key, type, objcName });
    }
  
    const prefix = options.rootClassPrefix;
    let code = `@interface ${prefix}${className} : NSObject\n\n`;
  
    if (options.properties) {
      for (const field of fields) {
        const nullability = options.nullability ? 'nullable ' : '';
        code += `@property (nonatomic, strong, ${nullability}) ${field.type}${field.objcName};\n`;
      }
    }
  
    code += `\n@end\n\n`;
  
    if (options.initializers && fields.length > 0) {
      code += `@implementation ${prefix}${className}\n\n`;
      code += `- (instancetype)initWith${toPascalCase(fields[0].objcName)}:(${fields[0].type})${fields[0].objcName}`;
      for (let i = 1; i < fields.length; i++) {
        const field = fields[i];
        code += ` ${field.objcName}:(${field.type})${field.objcName}`;
      }
      code += ` {\n    self = [super init];\n    if (self) {\n`;
      for (const field of fields) {
        code += `        _${field.objcName} = ${field.objcName};\n`;
      }
      code += `    }\n    return self;\n}\n\n@end\n`;
    }
  
    classes.set(className, code);
  }
  
  export function generateObjCCode(
    json: any,
    rootClassName: string = "DataModel",
    options: ObjCGeneratorOptions = defaultOptions
  ): string {
    if (typeof json !== 'object' || json === null) {
      throw new Error("Invalid JSON object.");
    }
  
    const classes = new Map<string, string>();
    const className = toPascalCase(rootClassName);
  
    generateClass(className, json, classes, options);
  
    return Array.from(classes.values()).reverse().join('\n');
  }
  
