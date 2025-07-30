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

        expect(normGenerated).toContain('using System;');
        expect(normGenerated).toContain('using System.Collections.Generic;');
        expect(normGenerated).toContain('using System.Text.Json.Serialization;');
        
        expect(normGenerated).toContain('namespace MyModels');
        expect(normGenerated).toContain('public record UserData');
        
        expect(normGenerated).toContain('[JsonPropertyName("id")] public int? Id { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("is_active")] public bool? IsActive { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("created_at")] public DateTime? CreatedAt { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("preferences")] public Preferences? Preferences { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("roles")] public List<string>? Roles { get; init; }');
        expect(normGenerated).toContain('[JsonPropertyName("profile_picture")] public object? ProfilePicture { get; init; }');

        expect(normGenerated).toContain('public record Preferences');
        expect(normGenerated).toContain('[JsonPropertyName("newsletter")] public bool? Newsletter { get; init; }');
    });

    it('should generate a class with mutable setters', () => {
        const options: CSharpGeneratorOptions = { ...defaultOptions, useRecords: false, propertySetters: 'set' };
        const generated = generateCSharpCode({ "name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('public class User');
        expect(normGenerated).toContain('public string? Name { get; set; }');
        expect(normGenerated).not.toContain('record');
        expect(normGenerated).not.toContain('init');
    });

    it('should generate without JSON annotations if disabled', () => {
        const options: CSharpGeneratorOptions = { ...defaultOptions, jsonAnnotations: false };
        const generated = generateCSharpCode({ "user_name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).not.toContain('[JsonPropertyName("user_name")]');
        expect(normGenerated).not.toContain('using System.Text.Json.Serialization;');
        expect(normGenerated).toContain('public string? UserName { get; init; }'); // The name is still PascalCased
    });

    it('should generate an array type instead of List<T>', () => {
        const options: CSharpGeneratorOptions = { ...defaultOptions, listType: 'T[]' };
        const generated = generateCSharpCode({ "tags": ["one", "two"] }, 'Post', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('public string[]? Tags { get; init; }');
        expect(normGenerated).not.toContain('List<string>');
    });

    it('should handle complex nested structures', () => {
        const complexJson = {
            "outer": {
                "inner_list": [
                    { "value": 1 },
                    { "value": 2 }
                ]
            }
        };
        const generated = generateCSharpCode(complexJson, 'Complex', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for correct class structure and property types
        expect(normGenerated).toContain('public record Complex');
        expect(normGenerated).toContain('[JsonPropertyName("outer")] public Outer? Outer { get; init; }');
        
        expect(normGenerated).toContain('public record Outer');
        expect(normGenerated).toContain('[JsonPropertyName("inner_list")] public List<InnerList>? InnerList { get; init; }');
        
        expect(normGenerated).toContain('public record InnerList');
        expect(normGenerated).toContain('[JsonPropertyName("value")] public int? Value { get; init; }');
    });
});
