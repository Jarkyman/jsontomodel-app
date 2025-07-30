
import { generateVbNetCode, VbNetGeneratorOptions } from '../vbnet-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
    "is_active": true,
    "created_at": "2025-07-29T12:00:00Z",
    "preferences": {
        "newsletter": false,
    },
    "roles": ["admin", "editor"],
    "profile_picture": null
};

const defaultOptions: VbNetGeneratorOptions = {
    moduleName: "ApiModels",
    jsonAnnotations: true,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateVbNetCode', () => {

    it('should generate a default module with classes and JsonProperty attributes', () => {
        const generated = generateVbNetCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);
        
        // Check for module and imports
        expect(normGenerated).toContain('Imports Newtonsoft.Json');
        expect(normGenerated).toContain('Public Module ApiModels');
        
        // Check for UserData class and properties (always PascalCase)
        expect(normGenerated).toContain('Public Class UserData');
        expect(normGenerated).toContain('<JsonProperty("id")> Public Property Id As Integer?');
        expect(normGenerated).toContain('<JsonProperty("is_active")> Public Property IsActive As Boolean?');
        expect(normGenerated).toContain('<JsonProperty("created_at")> Public Property CreatedAt As Date?');
        expect(normGenerated).toContain('<JsonProperty("preferences")> Public Property Preferences As Preferences');
        expect(normGenerated).toContain('<JsonProperty("roles")> Public Property Roles As List(Of String)');
        expect(normGenerated).toContain('<JsonProperty("profile_picture")> Public Property ProfilePicture As Object');
        
        // Check for nested Preferences class
        expect(normGenerated).toContain('Public Class Preferences');
        expect(normGenerated).toContain('<JsonProperty("newsletter")> Public Property Newsletter As Boolean?');
    });

    it('should generate without JsonProperty attributes if disabled', () => {
        const options: VbNetGeneratorOptions = { ...defaultOptions, jsonAnnotations: false };
        const generated = generateVbNetCode({ "user_name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).not.toContain('<JsonProperty("user_name")>');
        expect(normGenerated).not.toContain('Imports Newtonsoft.Json');
        // Property is still PascalCase
        expect(normGenerated).toContain('Public Property UserName As String');
    });

    it('should still use PascalCase even if JSON key is already PascalCase', () => {
        const options: VbNetGeneratorOptions = { ...defaultOptions };
        const generated = generateVbNetCode({ "UserName": "Test" }, 'User', options);
        const normGenerated = normalize(generated);

        // JsonProperty should not be added because the name doesn't change
        expect(normGenerated).not.toContain('<JsonProperty("UserName")>');
        expect(normGenerated).toContain('Public Property UserName As String');
    });

    it('should handle complex nested structures', () => {
        const complexJson = {
            "outer_level": {
                "inner_list": [
                    { "item_value": 1 },
                    { "item_value": 2 }
                ]
            }
        };
        const generated = generateVbNetCode(complexJson, 'ComplexData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for correct class structure and property types
        expect(normGenerated).toContain('Public Class ComplexData');
        expect(normGenerated).toContain('<JsonProperty("outer_level")> Public Property OuterLevel As OuterLevel');
        
        expect(normGenerated).toContain('Public Class OuterLevel');
        expect(normGenerated).toContain('<JsonProperty("inner_list")> Public Property InnerList As List(Of InnerList)');
        
        expect(normGenerated).toContain('Public Class InnerList');
        expect(normGenerated).toContain('<JsonProperty("item_value")> Public Property ItemValue As Integer?');
    });

    it('should handle empty lists by typing them as List(Of Object)', () => {
        const jsonWithEmptyList = { "empty_items": [] };
        const generated = generateVbNetCode(jsonWithEmptyList, 'Container', defaultOptions);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('<JsonProperty("empty_items")> Public Property EmptyItems As List(Of Object)');
    });
});
