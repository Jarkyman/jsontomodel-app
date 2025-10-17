
import { generateSQLSchema, SQLGeneratorOptions } from '../sql-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "profile": {
        "theme": "dark",
        "show_email": false
    },
    "posts": [
        { "post_id": 1, "post_title": "First Post" }
    ]
};

const defaultOptions: SQLGeneratorOptions = {
    tablePrefix: '',
    useSnakeCase: true,
    includePrimaryKey: true,
    useNotNull: true,
    includeTimestamps: false,
    useForeignKeys: true,
    useTypeInference: true,
    defaultValues: false,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateSQLSchema', () => {

    it('should generate correct SQL with default options', () => {
        const generated = generateSQLSchema(fullJsonInput, 'user', defaultOptions);
        const normGenerated = normalize(generated);
        
        const expectedProfileTable = `
            CREATE TABLE user_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                show_email BOOLEAN NOT NULL,
                theme VARCHAR(255) NOT NULL
            );
        `;

        const expectedPostsTable = `
             CREATE TABLE user_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                post_title VARCHAR(255) NOT NULL,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES user(id)
            );
        `;

        const expectedUserTable = `
            CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                is_active BOOLEAN NOT NULL,
                profile_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                FOREIGN KEY (profile_id) REFERENCES user_profile(id)
            );
        `;
        
        expect(normGenerated).toContain(normalize(expectedProfileTable));
        expect(normGenerated).toContain(normalize(expectedPostsTable));
        expect(normGenerated).toContain(normalize(expectedUserTable));
    });

    it('should handle table prefixes and no foreign keys', () => {
        const options: SQLGeneratorOptions = { ...defaultOptions, tablePrefix: 'tbl_', useForeignKeys: false };
        const generated = generateSQLSchema(fullJsonInput, 'user', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('CREATE TABLE tbl_user');
        expect(normGenerated).toContain('CREATE TABLE tbl_user_profile');
        expect(normGenerated).toContain('CREATE TABLE tbl_user_posts');
        expect(normGenerated).not.toContain('FOREIGN KEY');
        expect(normGenerated).toContain('profile_id INTEGER NOT NULL');
    });

    it('should add timestamps and default values', () => {
        const options: SQLGeneratorOptions = { ...defaultOptions, includeTimestamps: true, defaultValues: true };
        const generated = generateSQLSchema({ "name": "test", "active": true }, 'product', options);
        const normGenerated = normalize(generated);
        
        const expectedProductTable = `
            CREATE TABLE product (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                name VARCHAR(255) NOT NULL DEFAULT 'test',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        expect(normGenerated).toContain(normalize(expectedProductTable));
    });

    it('should not use snake case if disabled', () => {
        const options: SQLGeneratorOptions = { ...defaultOptions, useSnakeCase: false };
        const generated = generateSQLSchema({ "userName": "test" }, 'SystemUser', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('CREATE TABLE SystemUser');
        expect(normGenerated).toContain('userName VARCHAR(255) NOT NULL');
    });
});
