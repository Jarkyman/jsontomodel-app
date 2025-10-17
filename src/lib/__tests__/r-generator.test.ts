
import { generateRCode, RGeneratorOptions } from '../r-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
    "is_active": true,
    "preferences": {
        "newsletter": false,
    },
    "roles": ["admin", "editor"]
};

const defaultOptions: RGeneratorOptions = {
    defaultValues: false,
    useStruct: true // This is ignored
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateRCode', () => {

    it('should generate correct R constructor functions with default options', () => {
        const generated = generateRCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        const expectedPreferences = `new_preferences <- function(newsletter = NULL) { structure(list(newsletter = newsletter), class = "Preferences") }`;
        const expectedUserData = `new_user_data <- function(id = NULL, is_active = NULL, name = NULL, preferences = NULL, roles = NULL) { structure(list(id = id, is_active = is_active, name = name, preferences = preferences, roles = roles), class = "UserData") }`;
        
        expect(normGenerated).toContain(normalize(expectedPreferences));
        expect(normGenerated).toContain(normalize(expectedUserData));
    });
    
    it('should generate with default values when option is true', () => {
        const options: RGeneratorOptions = { ...defaultOptions, defaultValues: true };
        const generated = generateRCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);

        const expectedPreferences = `new_preferences <- function(newsletter = FALSE) { structure(list(newsletter = newsletter), class = "Preferences") }`;
        const expectedUserData = `new_user_data <- function(id = 0, is_active = FALSE, name = "", preferences = list(), roles = list()) { structure(list(id = id, is_active = is_active, name = name, preferences = preferences, roles = roles), class = "UserData") }`;

        expect(normGenerated).toContain(normalize(expectedPreferences));
        expect(normGenerated).toContain(normalize(expectedUserData));
    });

    it('should handle deeply nested objects', () => {
        const deepJson = { "a": { "b": { "c": 1 } } };
        const generated = generateRCode(deepJson, 'Root', defaultOptions);
        const normGenerated = normalize(generated);
        
        const expectedC = `new_c <- function(c = NULL) { structure(list(c = c), class = "C") }`;
        const expectedB = `new_b <- function(c = NULL) { structure(list(c = c), class = "B") }`;
        const expectedA = `new_a <- function(b = NULL) { structure(list(b = b), class = "A") }`;
        const expectedRoot = `new_root <- function(a = NULL) { structure(list(a = a), class = "Root") }`;

        expect(normGenerated).toContain(normalize(expectedC));
        expect(normGenerated).toContain(normalize(expectedB));
        expect(normGenerated).toContain(normalize(expectedA));
        expect(normGenerated).toContain(normalize(expectedRoot));
    });

    it('should throw an error for invalid JSON', () => {
        expect(() => generateRCode("not a json", 'Test', defaultOptions)).toThrow();
        expect(() => generateRCode([], 'Test', defaultOptions)).toThrow();
    });
});
