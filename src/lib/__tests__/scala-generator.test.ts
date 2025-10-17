
import { generateScaleCode, ScaleGeneratorOptions } from '../scala-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "profile": {
        "theme": "dark"
    },
    "tags": ["vip", "tester"]
};

const defaultOptions: ScaleGeneratorOptions = {
    useSnakeCase: true,
    includeTypes: true,
    defaultValues: false,
    includeStruct: true,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateScaleCode', () => {

    it('should generate correct Scala classes with default options', () => {
        const generated = generateScaleCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for profile class
        expect(normGenerated).toContain("case class UserDataProfile( val theme: String )");
        
        // Check for main user class
        expect(normGenerated).toContain("case class UserData( val user_id: Int, val user_name: String, val is_active: Boolean, val profile: UserDataProfile, val tags: List[String] )");
    });

    it('should generate without types if disabled', () => {
        const options: ScaleGeneratorOptions = { ...defaultOptions, includeTypes: false };
        const generated = generateScaleCode({ "id": 1 }, 'Simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('case class Simple( val id )');
    });
    
    it('should include default values if enabled', () => {
        const options: ScaleGeneratorOptions = { ...defaultOptions, defaultValues: true };
        const generated = generateScaleCode({ "name": "test", "count": 5 }, 'Item', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain("case class Item( val name: String = \"test\", val count: Int = 5 )");
    });

    it('should not use snake case if disabled', () => {
        const options: ScaleGeneratorOptions = { ...defaultOptions, useSnakeCase: false };
        const generated = generateScaleCode({ "userName": "test" }, 'UserData', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('case class UserData( val userName: String )');
    });

    it('should not generate a class body if includeStruct is false', () => {
        const options: ScaleGeneratorOptions = { ...defaultOptions, includeStruct: false, useSnakeCase: false };
        const generated = generateScaleCode({ "name": "test" }, 'Simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('class Simple()'); // Empty parenthesis
    });
});
