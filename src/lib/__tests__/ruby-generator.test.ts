
import { generateRubyCode, RubyGeneratorOptions } from '../ruby-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "created_at": "2023-10-27T10:00:00Z",
    "user_profile": {
        "theme": "dark",
        "show_email": false
    },
    "tags": ["vip", "early_adopter"],
    "inventory": [
        { "item_id": 1, "quantity": 10 },
    ]
};

const defaultOptions: RubyGeneratorOptions = {
    attrAccessor: true,
    snakeCase: true,
    initialize: true,
    defaultValues: false,
    useStruct: false,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateRubyCode', () => {

    it('should generate a correct Ruby class with default options', () => {
        const generated = generateRubyCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);
        
        // Main class
        expect(normGenerated).toContain('class UserData');
        expect(normGenerated).toContain('attr_accessor :user_id, :user_name, :is_active, :created_at, :user_profile, :tags, :inventory');
        expect(normGenerated).toContain('def initialize(user_id, user_name, is_active, created_at, user_profile, tags, inventory)');
        expect(normGenerated).toContain('@user_id = user_id');
        
        // Nested classes
        expect(normGenerated).toContain('class UserProfile');
        expect(normGenerated).toContain('attr_accessor :theme, :show_email');

        expect(normGenerated).toContain('class Inventory');
        expect(normGenerated).toContain('attr_accessor :item_id, :quantity');
    });

    it('should generate a Ruby Struct when useStruct is true', () => {
        const options: RubyGeneratorOptions = { ...defaultOptions, useStruct: true };
        const generated = generateRubyCode({ "name": "Test", "value": 1 }, 'DataItem', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toBe('DataItem = Struct.new(:name, :value)');
    });
    
    it('should not use snake_case when option is false', () => {
        const options: RubyGeneratorOptions = { ...defaultOptions, snakeCase: false };
        const generated = generateRubyCode({ "userName": "test" }, 'User', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('attr_accessor :userName');
        expect(normGenerated).toContain('@userName = userName');
    });
    
    it('should use default values in initialize if enabled', () => {
        const options: RubyGeneratorOptions = { ...defaultOptions, defaultValues: true };
        const generated = generateRubyCode({ "name": "test" }, 'User', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('def initialize(name = nil)');
        expect(normGenerated).toContain('@name = name || nil');
    });

    it('should generate without attr_accessor and initialize if disabled', () => {
        const options: RubyGeneratorOptions = { attrAccessor: false, snakeCase: true, initialize: false, defaultValues: false, useStruct: false };
        const generated = generateRubyCode({ "name": "test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toBe('class User end');
    });

    it('should throw an error for empty JSON', () => {
        expect(() => generateRubyCode({}, 'Empty', defaultOptions)).toThrow("Invalid or empty JSON object");
    });
});
