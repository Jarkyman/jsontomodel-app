import { generateErlangCode, ErlangGeneratorOptions } from '../erlang-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "profile": {
        "theme": "dark"
    },
    "tags": ["vip", "tester"]
};

const defaultOptions: ErlangGeneratorOptions = {
    useSnakeCase: true,
    includeTypes: true,
    includeDefaults: false,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateErlangCode', () => {

    it('should generate correct Erlang records with default options', () => {
        const generated = generateErlangCode(fullJsonInput, 'user_data', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for profile record
        expect(normGenerated).toContain("-record(user_data_profile, { theme }).");
        
        // Check for main user record
        expect(normGenerated).toContain("-record(user_data, { user_id, user_name, is_active, profile, tags }).");

        // Check for types
        expect(normGenerated).toContain("%% @type user_id :: integer()");
        expect(normGenerated).toContain("%% @type profile :: map()");
    });

    it('should generate without types if disabled', () => {
        const options: ErlangGeneratorOptions = { ...defaultOptions, includeTypes: false };
        const generated = generateErlangCode({ "id": 1 }, 'simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).not.toContain("%% @type");
    });
    
    it('should include default values if enabled', () => {
        const options: ErlangGeneratorOptions = { ...defaultOptions, includeDefaults: true };
        const generated = generateErlangCode({ "name": "test", "count": 5 }, 'item', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain("-record(item, { name = 'test', count = 5 }).");
    });

    it('should not use snake case if disabled', () => {
        const options: ErlangGeneratorOptions = { ...defaultOptions, useSnakeCase: false };
        const generated = generateErlangCode({ "userName": "test" }, 'UserData', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('-record(UserData, { userName }).');
    });

});

    