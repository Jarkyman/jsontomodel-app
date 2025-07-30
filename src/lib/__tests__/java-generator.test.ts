
import { generateJavaCode, JavaGeneratorOptions } from '../java-generator';

const defaultOptions: JavaGeneratorOptions = {
    getters: true,
    setters: false,
    constructor: true,
    noArgsConstructor: true,
    builder: true,
    equalsHashCode: true,
    toString: true,
    snakeCase: true,
    nested: true,
    finalFields: true,
    jsonAnnotations: true,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateJavaCode', () => {
    it('should generate a simple Java class with default options', () => {
        const jsonInput = { 
            "id": 1, 
            "user_name": "Test",
            "is_active": true
        };
        
        const expectedOutput = `
            import com.fasterxml.jackson.annotation.JsonProperty;

            public class DataModel {
                @JsonProperty("id")
                private final Integer id;

                @JsonProperty("user_name")
                private final String userName;
                
                @JsonProperty("is_active")
                private final Boolean isActive;

                public DataModel(@JsonProperty("id") Integer id, @JsonProperty("user_name") String userName, @JsonProperty("is_active") Boolean isActive) {
                    this.id = id;
                    this.userName = userName;
                    this.isActive = isActive;
                }

                public Integer getId() {
                    return id;
                }

                public String getUserName() {
                    return userName;
                }

                public Boolean getIsActive() {
                    return isActive;
                }
            }
        `;
        
        const generated = generateJavaCode(jsonInput, 'DataModel', defaultOptions);
        expect(normalize(generated)).toContain(normalize(expectedOutput));
    });

    it('should generate nested classes correctly', () => {
        const jsonInput = {
            "user_data": {
                "user_id": 123
            }
        };

        const generated = generateJavaCode(jsonInput, 'Root', defaultOptions);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('public class Root');
        expect(normGenerated).toContain('private final UserData userData;');
        expect(normGenerated).toContain('public static class UserData');
        expect(normGenerated).toContain('private final Integer userId;');
    });
});
