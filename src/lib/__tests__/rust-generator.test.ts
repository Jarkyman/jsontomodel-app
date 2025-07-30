
import { generateRustCode, RustGeneratorOptions } from '../rust-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "last_seen_at": "2023-10-27T10:00:00Z",
    "balance": 1050.75,
    "user_profile": {
        "theme_preference": "dark",
        "show_email": false
    },
    "tags": ["vip", "early_adopter"],
    "inventory": [
        { "item_id": 1, "quantity": 10 },
        { "item_id": 2, "quantity": 5 }
    ],
    "metadata": null,
    "empty_list": [],
    "missing_field": undefined,
};

const defaultOptions: RustGeneratorOptions = {
    deriveClone: true,
    publicFields: true,
    useSerdeDefault: false,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateRustCode', () => {

    it('should generate correct Rust structs with default options', () => {
        const generated = generateRustCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for serde imports
        expect(normGenerated).toContain("use serde::{Serialize, Deserialize};");

        // Check for derive macros including new ones
        expect(normGenerated).toContain("#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]");

        // Check for correct field renaming
        expect(normGenerated).toContain('#[serde(rename = "user_id")]');
        expect(normGenerated).toContain('pub user_id: Option<i64>,');

        expect(normGenerated).toContain('#[serde(rename = "last_seen_at")]');
        expect(normGenerated).toContain('pub last_seen_at: Option<String>,');

        // Check for nested structs
        expect(normGenerated).toContain('pub user_profile: Option<UserProfile>,');
        expect(normGenerated).toContain('struct UserProfile {');
        expect(normGenerated).toContain('#[serde(rename = "theme_preference")]');
        expect(normGenerated).toContain('pub theme_preference: Option<String>,');

        // Check for vector types
        expect(normGenerated).toContain('pub inventory: Option<Vec<Inventory>>,');
        expect(normGenerated).toContain('struct Inventory {');
        
        // Check for null and empty list handling
        expect(normGenerated).toContain('pub metadata: Option<serde_json::Value>,');
        expect(normGenerated).toContain('pub empty_list: Option<Vec<serde_json::Value>>,');
        expect(normGenerated).toContain('use serde_json;');
    });

    it('should generate without extra derives when disabled', () => {
        const options: RustGeneratorOptions = { deriveClone: false, publicFields: true, useSerdeDefault: false };
        const generated = generateRustCode({ id: 1 }, 'Simple', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('#[derive(Debug, Serialize, Deserialize)]');
        expect(normGenerated).not.toContain('Clone');
        expect(normGenerated).not.toContain('PartialEq');
    });

    it('should generate with private fields when disabled', () => {
        const options: RustGeneratorOptions = { deriveClone: true, publicFields: false, useSerdeDefault: false };
        const generated = generateRustCode({ id: 1 }, 'Simple', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('id: Option<i64>,');
        expect(normGenerated).not.toContain('pub id');
    });
    
    it('should include #[serde(default)] when enabled', () => {
        const options: RustGeneratorOptions = { ...defaultOptions, useSerdeDefault: true };
        const generated = generateRustCode({ id: 1 }, 'Simple', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('#[serde(rename = "id", default)]');
    });


    it('should handle a simple JSON object correctly', () => {
        const simpleJson = { "id": 1, "name": "test" };
        const generated = generateRustCode(simpleJson, 'Simple', defaultOptions);
        const normGenerated = normalize(generated);

        const expected = `
            use serde::{Serialize, Deserialize}; 
            
            #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)] 
            pub struct Simple { 
                #[serde(rename = "id")] 
                pub id: Option<i64>, 
                
                #[serde(rename = "name")] 
                pub name: Option<String>, 
            }
        `;
        
        expect(normGenerated).toBe(normalize(expected));
    });

    it('should throw an error for empty JSON', () => {
        expect(() => generateRustCode({}, 'Empty', defaultOptions)).toThrow("Invalid or empty JSON object provided.");
    });
    
});
