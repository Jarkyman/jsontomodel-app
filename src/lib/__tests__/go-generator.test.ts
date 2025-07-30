
import { generateGoCode, GoGeneratorOptions } from '../go-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
    "is_active": true,
    "created_at": "2025-07-29T12:00:00Z",
    "preferences": {
        "newsletter": false,
    },
    "roles": ["admin", "editor"],
    "profile_picture_url": null,
    "scores": [10, 20, 30.5]
};

const defaultOptions: GoGeneratorOptions = {
    usePointers: true,
    packageName: 'models',
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateGoCode', () => {

    it('should generate correct Go structs with default options (pointers)', () => {
        const generated = generateGoCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('package models');
        expect(normGenerated).toContain('import "time"');

        const expectedUserDataStruct = `
            type UserData struct { 
                CreatedAt *time.Time \`json:"created_at,omitempty"\`
                ID *int \`json:"id,omitempty"\`
                IsActive *bool \`json:"is_active,omitempty"\` 
                Name *string \`json:"name,omitempty"\`
                Preferences *Preferences \`json:"preferences,omitempty"\` 
                ProfilePictureURL interface{} \`json:"profile_picture_url,omitempty"\` 
                Roles []*string \`json:"roles,omitempty"\`
                Scores []*float64 \`json:"scores,omitempty"\`
            }
        `;
        const expectedPreferencesStruct = `
            type Preferences struct { 
                Newsletter *bool \`json:"newsletter,omitempty"\`
            }
        `;
        
        expect(normGenerated).toContain(normalize(expectedUserDataStruct));
        expect(normGenerated).toContain(normalize(expectedPreferencesStruct));
    });

    it('should generate Go structs without pointers when usePointers is false', () => {
        const options: GoGeneratorOptions = { ...defaultOptions, usePointers: false };
        const generated = generateGoCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);
        
        const expectedUserDataStruct = `
            type UserData struct { 
                CreatedAt time.Time \`json:"created_at,omitempty"\`
                ID int \`json:"id,omitempty"\`
                IsActive bool \`json:"is_active,omitempty"\` 
                Name string \`json:"name,omitempty"\`
                Preferences Preferences \`json:"preferences,omitempty"\` 
                ProfilePictureURL interface{} \`json:"profile_picture_url,omitempty"\` 
                Roles []string \`json:"roles,omitempty"\`
                Scores []float64 \`json:"scores,omitempty"\`
            }
        `;

        expect(normGenerated).toContain(normalize(expectedUserDataStruct));
        // Check a pointer-specific character
        expect(normGenerated).not.toContain('*string');
        expect(normGenerated).not.toContain('*int');
    });

    it('should handle complex nested structures', () => {
        const complexJson = {
            "outer_level": {
                "inner_list": [
                    { "item_value": 1, "item_name": "one" },
                    { "item_value": 2, "item_name": "two" }
                ]
            }
        };
        const generated = generateGoCode(complexJson, 'ComplexData', defaultOptions);
        const normGenerated = normalize(generated);

        const expectedRoot = `
            type ComplexData struct { 
                OuterLevel *OuterLevel \`json:"outer_level,omitempty"\`
            }
        `;
        const expectedOuter = `
            type OuterLevel struct { 
                InnerList []*InnerList \`json:"inner_list,omitempty"\`
            }
        `;
        const expectedInner = `
            type InnerList struct { 
                ItemName *string \`json:"item_name,omitempty"\` 
                ItemValue *int \`json:"item_value,omitempty"\` 
            }
        `;
        
        expect(normGenerated).toContain(normalize(expectedRoot));
        expect(normGenerated).toContain(normalize(expectedOuter));
        expect(normGenerated).toContain(normalize(expectedInner));
    });

    it('should handle empty lists and null values correctly', () => {
        const json = {
            "empty_list": [],
            "field_null": null
        };
        const generated = generateGoCode(json, 'EdgeCases', defaultOptions);
        const normGenerated = normalize(generated);
        
        const expectedStruct = `
            type EdgeCases struct { 
                EmptyList []interface{} \`json:"empty_list,omitempty"\`
                FieldNull interface{} \`json:"field_null,omitempty"\`
            }
        `;
        
        expect(normGenerated).toContain(normalize(expectedStruct));
    });

    it('should change package name based on options', () => {
        const options: GoGeneratorOptions = { ...defaultOptions, packageName: 'api' };
        const generated = generateGoCode({ "id": 1 }, 'Test', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('package api');
    });
});

    