
import { generateCppCode, CppGeneratorOptions } from '../cpp-generator';

const fullJsonInput = {
    "user_id": 123,
    "user_name": "John Doe",
    "is_active": true,
    "last_seen": "2023-10-27T10:00:00Z", // Not a standard date format, should be string
    "balance": 1050.75,
    "user_profile": {
        "theme": "dark",
        "show_email": false
    },
    "tags": ["vip", "early_adopter"],
    "inventory": [
        { "item_id": 1, "quantity": 10 },
        { "item_id": 2, "quantity": 5 }
    ],
    "metadata": null
};


const defaultOptions: CppGeneratorOptions = {
    namespace: "ApiModels",
    usePointersForNull: false,
    cppVersion: "17"
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generateCppCode', () => {

    it('should generate a full C++ header with nlohmann/json integration', () => {
        const generated = generateCppCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for headers
        expect(normGenerated).toContain('#include <string>');
        expect(normGenerated).toContain('#include <vector>');
        expect(normGenerated).toContain('#include <optional>');
        expect(normGenerated).toContain('#include <nlohmann/json.hpp>');

        // Check for namespace
        expect(normGenerated).toContain('namespace ApiModels {');

        // Check for forward declarations
        expect(normGenerated).toContain('struct UserData;');
        expect(normGenerated).toContain('struct UserProfile;');
        expect(normGenerated).toContain('struct Inventory;');

        // Check for struct definitions
        expect(normGenerated).toContain('struct UserData { std::optional<double> balance; std::optional<std::vector<Inventory>> inventory; std::optional<bool> is_active; std::optional<std::string> last_seen; std::optional<nlohmann::json> metadata; std::optional<std::vector<std::string>> tags; std::optional<int> user_id; std::optional<std::string> user_name; std::optional<UserProfile> user_profile; };');
        expect(normGenerated).toContain('struct UserProfile { std::optional<bool> show_email; std::optional<std::string> theme; };');
        expect(normGenerated).toContain('struct Inventory { std::optional<int> item_id; std::optional<int> quantity; };');


        // Check for NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE macros
        expect(normGenerated).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(UserData, balance, inventory, is_active, last_seen, metadata, tags, user_id, user_name, user_profile);');
        expect(normGenerated).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(UserProfile, show_email, theme);');
        expect(normGenerated).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Inventory, item_id, quantity);');
    });

    it('should handle empty JSON object', () => {
        const generated = generateCppCode({}, 'Empty', defaultOptions);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('struct Empty { };');
        expect(normGenerated).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Empty);');
    });

    it('should handle JSON with only null values', () => {
        const json = { "field1": null, "field2": null };
        const generated = generateCppCode(json, 'Nulls', defaultOptions);
        const normGenerated = normalize(generated);
        
        // nlohmann::json is the fallback for null
        expect(normGenerated).toContain('struct Nulls { std::optional<nlohmann::json> field1; std::optional<nlohmann::json> field2; };');
        expect(normGenerated).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Nulls, field1, field2);');
    });
    
    it('should handle empty arrays correctly', () => {
        const json = { "empty_list": [] };
        const generated = generateCppCode(json, 'EmptyList', defaultOptions);
        const normGenerated = normalize(generated);

        // The type for an empty array is a vector of json objects
        expect(normGenerated).toContain('struct EmptyList { std::optional<std::vector<nlohmann::json>> empty_list; };');
        expect(normGenerated).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EmptyList, empty_list);');
    });
});
