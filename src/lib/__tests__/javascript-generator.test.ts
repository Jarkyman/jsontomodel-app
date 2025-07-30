
import { generateJavaScriptCode } from '../javascript-generator';

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

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateJavaScriptCode', () => {
    it('should generate a correct ES6 class with JSDoc and methods', () => {
        const generated = generateJavaScriptCode(fullJsonInput, 'UserData');
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
        expect(normGenerated).toContain("'created_at': this.createdAt?.toISOString(),");
        expect(normGenerated).toContain("'preferences': this.preferences?.toJSON(),");
        expect(normGenerated).toContain("'projects': this.projects?.map(item => item.toJSON()),");

        // Check for nested Preferences class
        expect(normGenerated).toContain('class Preferences {');
        expect(normGenerated).toContain('/** @type {boolean|null} */ newsletter;');
        expect(normGenerated).toContain('this.newsletter = data.newsletter ?? null;');

        // Check for nested Project class
        expect(normGenerated).toContain('class Project {');
        expect(normGenerated).toContain('/** @type {string|null} */ id;');
        expect(normGenerated).toContain('/** @type {string|null} */ title;');
    });

    it('should handle an empty JSON object gracefully', () => {
        const generated = generateJavaScriptCode({}, 'EmptyModel');
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('class EmptyModel {');
        expect(normGenerated).toContain('constructor(data = {}) {}');
        expect(normGenerated).toContain('static fromJSON(data) { return new EmptyModel(data); }');
        expect(normGenerated).toContain('toJSON() { return {}; }');
    });

    it('should handle arrays of primitive types', () => {
         const generated = generateJavaScriptCode({ "tags": ["a", "b", "c"] }, 'Post');
         const normGenerated = normalize(generated);
         expect(normGenerated).toContain('/** @type {string[]|null} */ tags;');
         expect(normGenerated).toContain('this.tags = data.tags ?? null;');
    });
});

    