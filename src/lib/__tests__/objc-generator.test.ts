
import { generateObjCCode, ObjCGeneratorOptions } from '../objc-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "profile": {
        "theme": "dark"
    },
    "tags": ["vip", "tester"]
};

const defaultOptions: ObjCGeneratorOptions = {
    properties: true,
    initializers: true,
    nullability: true,
    snakeCase: true,
    rootClassPrefix: "DM"
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateObjCCode', () => {

    it('should generate correct Objective-C code with default options', () => {
        const generated = generateObjCCode(fullJsonInput, 'User', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for Profile class
        expect(normGenerated).toContain('@interface DMProfile : NSObject');
        expect(normGenerated).toContain('@property (nonatomic, strong, nullable) NSString *theme;');
        expect(normGenerated).toContain('- (instancetype)initWithTheme:(NSString *)theme');

        // Check for User class
        expect(normGenerated).toContain('@interface DMUser : NSObject');
        expect(normGenerated).toContain('@property (nonatomic, strong, nullable) NSNumber *userId;');
        expect(normGenerated).toContain('@property (nonatomic, strong, nullable) DMProfile *profile;');
        expect(normGenerated).toContain('@property (nonatomic, strong, nullable) NSArray *tags;');
        
        // Check for User initializer
        expect(normGenerated).toContain('- (instancetype)initWithUserId:(NSNumber *)userId userName:(NSString *)userName isActive:(NSNumber *)isActive profile:(DMProfile *)profile tags:(NSArray *)tags');
    });

    it('should generate without nullability annotations when disabled', () => {
        const options = { ...defaultOptions, nullability: false };
        const generated = generateObjCCode({ name: "test" }, 'Simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).not.toContain('nullable');
        expect(normGenerated).toContain('@property (nonatomic, strong, ) NSString *name;');
    });
    
    it('should not convert to camelCase when snakeCase is false', () => {
        const options = { ...defaultOptions, snakeCase: false };
        const generated = generateObjCCode({ "user_name": "test" }, 'User', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('@property (nonatomic, strong, nullable) NSString *user_name;');
    });

    it('should generate without properties or initializers when disabled', () => {
        const options = { ...defaultOptions, properties: false, initializers: false };
        const generated = generateObjCCode({ name: "test" }, 'Simple', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('@interface DMSimple : NSObject');
        expect(normGenerated).not.toContain('@property');
        expect(normGenerated).not.toContain('@implementation');
        expect(normGenerated).toContain('@end');
    });
    
    it('should generate without a prefix if empty', () => {
        const options = { ...defaultOptions, rootClassPrefix: "" };
        const generated = generateObjCCode({ name: "test" }, 'Simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('@interface Simple : NSObject');
    });

    it('should throw an error for invalid JSON', () => {
        expect(() => generateObjCCode("invalid", 'Test', defaultOptions)).toThrow();
    });

    it('should use camelCase when snakeCase is true', () => {
        const options = { ...defaultOptions, snakeCase: true };
        const generated = generateObjCCode({ "user_name": "test" }, 'User', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('@property (nonatomic, strong, nullable) NSString *userName;');
    });
});
