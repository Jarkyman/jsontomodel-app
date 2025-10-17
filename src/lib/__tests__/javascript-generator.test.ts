
import { generateJavaScriptCode, JavaScriptGeneratorOptions } from '../javascript-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
    "email": "test@example.com",
    "is_active": true,
    "created_at": "2025-07-29T12:00:00Z",
    "preferences": {
        "newsletter": false,
    },
    "roles": ["admin", "editor"],
    "profile_picture": null,
    "projects": [
        {
            "id": "p1",
            "title": "Project X"
        }
    ]
};

const defaultOptions: JavaScriptGeneratorOptions = {
    includeJSDoc: true,
    includeFromToJSON: true,
    convertDates: true,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateJavaScriptCode', () => {
    it('should generate a correct ES6 class with all options enabled', () => {
        const generated = generateJavaScriptCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for UserData class
        expect(normGenerated).toContain('class UserData {');
        expect(normGenerated).toContain('/** @type {number|null} */ id;');
        expect(normGenerated).toContain('/** @type {string|null} */ name;');
        expect(normGenerated).toContain('/** @type {Date|null} */ createdAt;');
        expect(normGenerated).toContain('/** @type {Preferences|null} */ preferences;');
        expect(normGenerated).toContain('/** @type {Project[]|null} */ projects;');
        
        // Check constructor
        expect(normGenerated).toContain('constructor(data = {}) {');
        expect(normGenerated).toContain('this.id = data.id ?? null;');
        expect(normGenerated).toContain('this.createdAt = data.created_at ? new Date(data.created_at) : null;');
        expect(normGenerated).toContain('this.preferences = data.preferences ? new Preferences(data.preferences) : null;');
        expect(normGenerated).toContain('this.projects = Array.isArray(data.projects) ? data.projects.map(item => new Project(item)) : null;');

        // Check fromJSON
        expect(normGenerated).toContain('static fromJSON(data) {');
        expect(normGenerated).toContain('return new UserData(data);');

        // Check toJSON
        expect(normGenerated).toContain('toJSON() {');
        expect(normGenerated).toContain("'created_at': this.createdAt?.toISOString()");
        expect(normGenerated).toContain("'preferences': this.preferences?.toJSON()");
        expect(normGenerated).toContain("'projects': this.projects?.map(item => item.toJSON())");

        // Check for nested Preferences class
        expect(normGenerated).toContain('class Preferences {');
        expect(normGenerated).toContain('/** @type {boolean|null} */ newsletter;');
        expect(normGenerated).toContain('this.newsletter = data.newsletter ?? null;');

        // Check for nested Project class
        expect(normGenerated).toContain('class Project {');
        expect(normGenerated).toContain('/** @type {string|null} */ id;');
        expect(normGenerated).toContain('/** @type {string|null} */ title;');
    });

    it('should generate without JSDoc when disabled', () => {
        const options: JavaScriptGeneratorOptions = { ...defaultOptions, includeJSDoc: false };
        const generated = generateJavaScriptCode({ name: "Test" }, 'User', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).not.toContain('/**');
        expect(normGenerated).toContain('this.name = data.name ?? null;');
    });

    it('should generate without from/toJSON methods when disabled', () => {
        const options: JavaScriptGeneratorOptions = { ...defaultOptions, includeFromToJSON: false };
        const generated = generateJavaScriptCode({ name: "Test" }, 'User', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).not.toContain('fromJSON');
        expect(normGenerated).not.toContain('toJSON');
    });

    it('should generate without date conversion logic when disabled', () => {
        const options: JavaScriptGeneratorOptions = { ...defaultOptions, convertDates: false };
        const generated = generateJavaScriptCode({ registered_at: "2025-01-01T00:00:00Z" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('/** @type {string|null} */ registeredAt;');
        expect(normGenerated).toContain('this.registeredAt = data.registered_at ?? null;'); // Should not create new Date()
        expect(normGenerated).toContain("'registered_at': this.registeredAt"); // Should not call toISOString()
    });

    it('should handle an empty JSON object gracefully', () => {
        const generated = generateJavaScriptCode({}, 'EmptyModel', defaultOptions);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('class EmptyModel {');
        expect(normGenerated).toContain('constructor(data = {}) {}');
        expect(normGenerated).toContain('static fromJSON(data) { return new EmptyModel(data); }');
        expect(normGenerated).toContain('toJSON() { return {}; }');
    });
});
