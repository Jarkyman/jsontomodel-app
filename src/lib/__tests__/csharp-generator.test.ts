
import { generateCSharpCode, CSharpGeneratorOptions } from '../csharp-generator';

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

const defaultOptions: CSharpGeneratorOptions = {
    namespace: "MyModels",
    useRecords: true,
    propertySetters: 'init',
    jsonAnnotations: true,
    listType: 'List<T>'
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateCSharpCode', () => {

    it('should generate a default record with init setters and JsonPropertyName', () => {
        const generated = generateCSharpCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for using statements
        expect(normGenerated).toContain('using System;');
        expect(normGenerated).toContain('using System.Collections.Generic;');
        expect(normGenerated).toContain('using System.Text.Json.Serialization;');
        
        // Check for namespace and record definition
        expect(normGenerated).toContain('namespace MyModels');
        expect(normGenerated).toContain('public record UserData');
        
        // Check for properties
        expect(normGenerated).toContain('[JsonPropertyName("id")] public int? Id { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("is_active")] public bool? IsActive { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("created_at")] public DateTime? CreatedAt { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("preferences")] public Preferences? Preferences { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("roles")] public List<string>? Roles { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("profile_picture")] public object? ProfilePicture { get; init; }');

        // Check for nested record
        expect(normGenerated).toContain('public record Preferences');
        expect(normGenerated).toContain('[JsonPropertyName("newsletter")] public bool? Newsletter { get; init; }');
    });
});
