
import { generateRustCode } from '../rust-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "last_seen_at": "2023-10-27T10:00:00Z", // Should be a string
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
    "empty_list": []
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateRustCode', () => {

    it('should generate correct Rust structs with serde attributes and extra derives', () => {
        const generated = generateRustCode(fullJsonInput, 'UserData');
        const normGenerated = normalize(generated);

        // Check for serde imports
        expect(normGenerated).toContain("use serde::{Serialize, Deserialize};");

        // Check for derive macros including new ones
        expect(normGenerated).toContain("#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]");

        // Check for correct field renaming
        expect(normGenerated).toContain('#[serde(rename = "user_id")]');
        expect(normGenerated).toContain('user_id: Option<i64>,');

        expect(normGenerated).toContain('#[serde(rename = "last_seen_at")]');
        expect(normGenerated).toContain('last_seen_at: Option<String>,');

        // Check for nested structs
        expect(normGenerated).toContain('user_profile: Option<UserProfile>,');
        expect(normGenerated).toContain('struct UserProfile {');
        expect(normGenerated).toContain('#[serde(rename = "theme_preference")]');
        expect(normGenerated).toContain('theme_preference: Option<String>,');

        // Check for vector types
        expect(normGenerated).toContain('inventory: Option<Vec<Inventory>>,');
        expect(normGenerated).toContain('struct Inventory {');
        
        // Check for null and empty list handling
        expect(normGenerated).toContain('metadata: Option<serde_json::Value>,');
        expect(normGenerated).toContain('empty_list: Option<Vec<serde_json::Value>>,');
        expect(normGenerated).toContain('use serde_json;');
    });

    it('should handle a simple JSON object correctly', () => {
        const simpleJson = { "id": 1, "name": "test" };
        const generated = generateRustCode(simpleJson, 'Simple');
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
        expect(() => generateRustCode({}, 'Empty')).toThrow("Invalid or empty JSON object provided.");
    });
    
    it('should correctly handle fields that do not require renaming', () => {
        const jsonWithSnakeCase = { "user_id": 1 };
        const generated = generateRustCode(jsonWithSnakeCase, 'User');
        const normGenerated = normalize(generated);

        // Even if it matches, the rename attribute is added for consistency and safety
        expect(normGenerated).toContain('#[serde(rename = "user_id")]');
        expect(normGenerated).toContain('pub user_id: Option<i64>,');
    });
});
