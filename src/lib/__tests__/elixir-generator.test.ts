
import { generateElixirCode, ElixirGeneratorOptions } from '../elixir-generator';

const fullJsonInput = {
    "userId": 123,
    "userName": "John Doe",
    "isActive": true,
    "profile": {
        "themePreference": "dark"
    }
};

const defaultOptions: ElixirGeneratorOptions = {
    useSnakeCase: true,
    includeTypes: true,
    defaultValues: false,
    includeStruct: true,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateElixirCode', () => {
    it('should generate correct Elixir modules with snake_case for types and fields', () => {
        const generated = generateElixirCode(fullJsonInput, 'User', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for Profile module
        expect(normGenerated).toContain('defmodule UserProfile do');
        expect(normGenerated).toContain('@type theme_preference :: String.t()');
        expect(normGenerated).toContain('defstruct [ theme_preference: nil ]');

        // Check for User module
        expect(normGenerated).toContain('defmodule User do');
        expect(normGenerated).toContain('@type user_id :: integer');
        expect(normGenerated).toContain('@type user_name :: String.t()');
        expect(normGenerated).toContain('@type is_active :: boolean');
        expect(normGenerated).toContain('defstruct [ user_id: nil, user_name: nil, is_active: nil, profile: nil ]');
    });

    it('should generate without types and structs when disabled', () => {
        const options: ElixirGeneratorOptions = {
            useSnakeCase: true,
            includeTypes: false,
            includeStruct: false,
        };
        const generated = generateElixirCode({ "name": "test" }, 'Simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toBe('defmodule Simple do end');
    });

    it('should show default values as comments', () => {
        const options: ElixirGeneratorOptions = { ...defaultOptions, defaultValues: true };
        const generated = generateElixirCode({ "name": "test" }, 'Simple', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('defstruct [ name: nil # default: "test" ]');
    });

    it('should handle camelCase when snake_case is false', () => {
        const options: ElixirGeneratorOptions = { ...defaultOptions, useSnakeCase: false };
        const generated = generateElixirCode({ "userName": "test", "isActive": true }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('defstruct [ userName: nil, isActive: nil ]');
        expect(normGenerated).toContain('@type userName :: String.t()');
        expect(normGenerated).toContain('@type isActive :: boolean');
    });
});
