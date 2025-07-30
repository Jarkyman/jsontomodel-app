
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
        
        const generated = generateJavaCode(jsonInput, 'DataModel', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for imports
        expect(normGenerated).toContain('import com.fasterxml.jackson.annotation.JsonProperty;');
        expect(normGenerated).toContain('import java.util.Objects;');
        expect(normGenerated).toContain('import java.util.StringJoiner;');

        // Check for class and fields
        expect(normGenerated).toContain('public class DataModel');
        expect(normGenerated).toContain('@JsonProperty("user_name") private final String userName;');
        
        // Check for constructors
        expect(normGenerated).toContain('public DataModel() {}');
        expect(normGenerated).toContain('public DataModel(@JsonProperty("id") Integer id, @JsonProperty("user_name") String userName, @JsonProperty("is_active") Boolean isActive)');
        
        // Check for methods
        expect(normGenerated).toContain('public Integer getId()');
        expect(normGenerated).toContain('@Override public String toString()');
        expect(normGenerated).toContain('@Override public boolean equals(Object o)');
        expect(normGenerated).toContain('@Override public int hashCode()');
        
        // Check for Builder
        expect(normGenerated).toContain('public static final class Builder');
        expect(normGenerated).toContain('public Builder userName(String val)');
        expect(normGenerated).toContain('public DataModel build()');
    });

    it('should generate nested classes correctly', () => {
        const jsonInput = {
            "user_data": {
                "user_id": 123,
                "is_verified": true
            },
            "permissions": ["read", "write"]
        };

        const generated = generateJavaCode(jsonInput, 'Root', defaultOptions);
        const normGenerated = normalize(generated);
        
        // Root class checks
        expect(normGenerated).toContain('public class Root');
        expect(normGenerated).toContain('@JsonProperty("user_data") private final UserData userData;');
        expect(normGenerated).toContain('private final List<String> permissions;');
        expect(normGenerated).toContain('import java.util.List;');

        // Nested class checks
        expect(normGenerated).toContain('public static class UserData');
        expect(normGenerated).toContain('@JsonProperty("user_id") private final Integer userId;');
        expect(normGenerated).toContain('public Integer getUserId()');
        expect(normGenerated).toContain('public static final class Builder'); // Builder in nested class
        expect(normGenerated).toContain('public UserData build()');
    });

    it('should generate setters when finalFields is false', () => {
        const options: JavaGeneratorOptions = { ...defaultOptions, finalFields: false, setters: true };
         const jsonInput = { "name": "test" };
         const generated = generateJavaCode(jsonInput, 'User', options);
         const normGenerated = normalize(generated);
         
         expect(normGenerated).toContain('private String name;'); // not final
         expect(normGenerated).toContain('public void setName(String name)');
         expect(normGenerated).not.toContain('private final String name;');
    });

     it('should not generate setters when finalFields is true', () => {
        const options: JavaGeneratorOptions = { ...defaultOptions, finalFields: true, setters: true }; // setters should be ignored
         const jsonInput = { "name": "test" };
         const generated = generateJavaCode(jsonInput, 'User', options);
         const normGenerated = normalize(generated);
         
         expect(normGenerated).toContain('private final String name;');
         expect(normGenerated).not.toContain('public void setName(String name)');
    });

    it('should not generate JSON annotations when option is false', () => {
         const options: JavaGeneratorOptions = { ...defaultOptions, jsonAnnotations: false };
         const jsonInput = { "user_name": "test" };
         const generated = generateJavaCode(jsonInput, 'User', options);
         const normGenerated = normalize(generated);

         expect(normGenerated).not.toContain('@JsonProperty');
         expect(normGenerated).not.toContain('import com.fasterxml.jackson.annotation.JsonProperty;');
         // Constructor should not have annotations either
         expect(normGenerated).toContain('public User(String userName)');
    });
});
