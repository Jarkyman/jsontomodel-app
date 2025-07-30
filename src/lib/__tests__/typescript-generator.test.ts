
import { generateTypescriptCode, TypeScriptGeneratorOptions } from '../typescript-generator';

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

const defaultOptions: TypeScriptGeneratorOptions = {
    useType: true,
    optionalFields: true,
    readonlyFields: true,
    allowNulls: false,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateTypescriptCode', () => {

    it('should generate correct types with default options', () => {
        const generated = generateTypescriptCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        const expectedPreferences = `export type Preferences = { readonly newsletter?: boolean; };`;
        const expectedUserData = `export type UserData = { readonly id?: number; readonly name?: string; readonly isActive?: boolean; readonly createdAt?: Date | string; readonly preferences?: Preferences; readonly roles?: string[]; readonly profilePicture?: null; };`;
        
        expect(normGenerated).toContain(expectedPreferences);
        expect(normGenerated).toContain(expectedUserData);
    });

    it('should generate interfaces when useType is false', () => {
        const options: TypeScriptGeneratorOptions = { ...defaultOptions, useType: false };
        const generated = generateTypescriptCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);

        const expectedPreferences = `export interface Preferences { readonly newsletter?: boolean; }`;
        const expectedUserData = `export interface UserData { readonly id?: number; readonly name?: string; readonly isActive?: boolean; readonly createdAt?: Date | string; readonly preferences?: Preferences; readonly roles?: string[]; readonly profilePicture?: null; }`;

        expect(normGenerated).toContain(expectedPreferences);
        expect(normGenerated).toContain(expectedUserData);
    });

    it('should generate mutable, required fields', () => {
        const options: TypeScriptGeneratorOptions = { useType: true, optionalFields: false, readonlyFields: false, allowNulls: false };
        const generated = generateTypescriptCode({ name: "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        const expectedUser = `export type User = { name: string; };`;
        expect(normGenerated).toBe(expectedUser);
    });
    
    it('should handle complex nested structures and arrays', () => {
        const complexJson = {
            "outer_level": {
                "inner_list": [
                    { "item_value": 1 },
                    { "item_value": 2 }
                ]
            }
        };
        const generated = generateTypescriptCode(complexJson, 'ComplexData', defaultOptions);
        const normGenerated = normalize(generated);
        
        const expectedItem = `export type InnerList = { readonly itemValue?: number; };`
        const expectedOuter = `export type OuterLevel = { readonly innerList?: InnerList[]; };`
        const expectedRoot = `export type ComplexData = { readonly outerLevel?: OuterLevel; };`

        expect(normGenerated).toContain(expectedItem);
        expect(normGenerated).toContain(expectedOuter);
        expect(normGenerated).toContain(expectedRoot);
    });

    it('should allow nulls when option is enabled', () => {
        const options: TypeScriptGeneratorOptions = { ...defaultOptions, allowNulls: true };
        const generated = generateTypescriptCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);
        
        const expectedPreferences = `export type Preferences = { readonly newsletter?: boolean | null; };`;
        const expectedUserData = `export type UserData = { readonly id?: number | null; readonly name?: string | null; readonly isActive?: boolean | null; readonly createdAt?: Date | string | null; readonly preferences?: Preferences | null; readonly roles?: (string | null)[] | null; readonly profilePicture?: null; };`;

        expect(normGenerated).toContain(expectedPreferences);
        expect(normGenerated).toContain(expectedUserData);
    });
});

    

    