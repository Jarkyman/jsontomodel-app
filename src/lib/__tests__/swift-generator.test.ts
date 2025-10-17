
import { generateSwiftCode, SwiftGeneratorOptions } from '../swift-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
    "email": "test@example.com",
    "is_active": true,
    "created_at": "2025-07-29T12:00:00Z",
    "score": 89.75,
    "preferences": {
        "newsletter": false,
        "notifications": {
            "email": true,
            "sms": false,
            "push": true
        }
    },
    "roles": ["admin", "editor", "viewer"],
    "tags": [],
    "profile_picture": null
};

const defaultOptions: SwiftGeneratorOptions = {
    isCodable: true,
    useStruct: true,
    isEquatable: false,
    isHashable: false,
    generateCodingKeys: true,
    generateCustomInit: false,
    generateSampleData: false,
    isPublished: false,
    isMainActor: false,
    isCustomStringConvertible: false,
    dateStrategy: 'iso8601'
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateSwiftCode', () => {

    it('should generate a default struct with Codable', () => {
        const generated = generateSwiftCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('struct UserData: Codable');
        expect(normGenerated).toContain('let id: Int?');
        expect(normGenerated).toContain('let createdAt: Date?');
        expect(normGenerated).toContain('let profilePicture: AnyCodable?');
        expect(normGenerated).toContain('enum CodingKeys: String, CodingKey');
        expect(normGenerated).toContain('case isActive = "is_active"');
        expect(normGenerated).toContain('struct AnyCodable: Codable');
        expect(normGenerated).toContain('// To decode dates automatically');
    });

    it('should generate a class with all options enabled', () => {
        const allOptions: SwiftGeneratorOptions = {
            isCodable: true,
            useStruct: false, // class
            isEquatable: true,
            isHashable: true,
            generateCodingKeys: true,
            generateCustomInit: false,
            generateSampleData: true,
            isPublished: true,
            isMainActor: true,
            isCustomStringConvertible: true,
            dateStrategy: 'iso8601'
        };
        const generated = generateSwiftCode(fullJsonInput, 'UserData', allOptions);
        const normGenerated = normalize(generated);
        
        // Class definition
        expect(normGenerated).toContain('@MainActor class UserData: Codable, Equatable, Hashable, CustomStringConvertible, ObservableObject');
        
        // Properties
        expect(normGenerated).toContain('@Published var id: Int?');
        expect(normGenerated).toContain('@Published var createdAt: Date?');
        
        // Protocols
        expect(normGenerated).toContain('func hash(into hasher: inout Hasher)');
        expect(normGenerated).toContain('hasher.combine(id)');
        expect(normGenerated).toContain('func == (lhs: UserData, rhs: UserData) -> Bool');
        const allFieldsEquatable = Object.keys(fullJsonInput).sort().map(k => `lhs.${toCamelCase(k)} == rhs.${toCamelCase(k)}`).join(' && ');
        expect(normGenerated).toContain(allFieldsEquatable);
        
        // CustomStringConvertible
        expect(normGenerated).toContain('var description: String');
        expect(normGenerated).toContain('id: \\(String(describing: id))');

        // Sample Data
        expect(normGenerated).toContain('static var sample: UserData');
        expect(normGenerated).toContain('name: "Test User"');
        expect(normGenerated).toContain('preferences: Preferences.sample');
    });
    
    it('should handle nested objects and arrays correctly', () => {
        const generated = generateSwiftCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for nested classes/structs
        expect(normGenerated).toContain('struct Preferences: Codable');
        expect(normGenerated).toContain('let notifications: Notifications?');
        expect(normGenerated).toContain('struct Notifications: Codable');
        expect(normGenerated).toContain('let email: Bool?');
        
        // Check for array types
        expect(normGenerated).toContain('let roles: [String]?');
        expect(normGenerated).toContain('let tags: [AnyCodable]?');
    });

    it('should not generate CodingKeys if not needed', () => {
        const simpleJson = {
            "id": 1,
            "name": "test"
        };
        const generated = generateSwiftCode(simpleJson, 'Simple', defaultOptions);
        const normGenerated = normalize(generated);
        expect(normGenerated).not.toContain('enum CodingKeys');
    });
    
    it('should not include AnyCodable if not needed', () => {
         const jsonWithoutNulls = {
            "id": 123,
            "name": "Test User",
            "roles": ["admin"]
        };
        const generated = generateSwiftCode(jsonWithoutNulls, 'NoNulls', defaultOptions);
        const normGenerated = normalize(generated);
        expect(normGenerated).not.toContain('struct AnyCodable');
    });

    it('should generate a simple class when Codable is off', () => {
         const noCodableOptions: SwiftGeneratorOptions = { ...defaultOptions, isCodable: false, useStruct: false };
         const generated = generateSwiftCode(fullJsonInput, 'UserData', noCodableOptions);
         const normGenerated = normalize(generated);
         
         expect(normGenerated).toContain('class UserData: ObservableObject');
         expect(normGenerated).not.toContain(': Codable');
         expect(normGenerated).not.toContain('CodingKeys');
         expect(normGenerated).not.toContain('struct AnyCodable: Codable'); 
         expect(normGenerated).toContain('var profilePicture: Any?');
    });
});
