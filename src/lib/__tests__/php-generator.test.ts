

import { generatePhpCode, PhpGeneratorOptions } from '../php-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
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
        "name": "Project X"
      }
    ],
    "nullable_projects": null
};

const defaultOptions: PhpGeneratorOptions = {
    typedProperties: true,
    finalClasses: true,
    readonlyProperties: true,
    constructorPropertyPromotion: true,
    fromArray: true,
    toArray: true,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generatePhpCode', () => {

    it('should generate a default class with constructor property promotion', () => {
        const generated = generatePhpCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        // Check for correct class structure
        expect(normGenerated).toContain('final class UserData implements \\JsonSerializable');
        
        // Check for constructor property promotion syntax and @param docblock
        expect(normGenerated).toContain('/** * @param Project[]|null $projects */');
        expect(normGenerated).toContain('public function __construct( public readonly ?\\DateTimeInterface $createdAt, public readonly ?int $id, public readonly ?bool $isActive, public readonly ?string $name, public readonly mixed $nullableProjects, public readonly ?Preferences $preferences, public readonly mixed $profilePicture, public readonly ?array $projects, public readonly ?array $roles )');

        // Check for fromArray method
        expect(normGenerated).toContain('public static function fromArray(array $data): self');
        expect(normGenerated).toContain("isset($data['created_at']) ? new \\DateTimeImmutable($data['created_at']) : null");
        expect(normGenerated).toContain("isset($data['preferences']) ? Preferences::fromArray($data['preferences']) : null");
        expect(normGenerated).toContain("is_array($data['projects'] ?? null) ? array_map(fn($item) => Project::fromArray($item), $data['projects']) : null");


        // Check for toArray method
        expect(normGenerated).toContain('public function toArray(): array');
        expect(normGenerated).toContain("'created_at' => $this->createdAt?->format(\\DateTimeInterface::ATOM)");
        expect(normGenerated).toContain("'preferences' => $this->preferences?->toArray()");
        expect(normGenerated).toContain("'projects' => isset($this->projects) ? array_map(fn($item) => $item->toArray(), $this->projects) : null");

        // Check for jsonSerialize method
        expect(normGenerated).toContain('public function jsonSerialize(): mixed');
        expect(normGenerated).toContain('return $this->toArray();');

        // Check nested class
        expect(normGenerated).toContain('final class Preferences');
        expect(normGenerated).toContain('public readonly ?bool $newsletter');
    });

    it('should generate without constructor property promotion if disabled', () => {
        const options: PhpGeneratorOptions = { ...defaultOptions, constructorPropertyPromotion: false };
        const generated = generatePhpCode({ "name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('public readonly ?string $name;');
        expect(normGenerated).toContain('public function __construct(array $data)');
        expect(normGenerated).toContain('$this->name = $data[\'name\'] ?? null;');
    });

    it('should generate non-final, non-readonly classes', () => {
        const options: PhpGeneratorOptions = { ...defaultOptions, finalClasses: false, readonlyProperties: false };
        const generated = generatePhpCode({ "name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('class User');
        expect(normGenerated).toContain('public ?string $name');
        expect(normGenerated).not.toContain('final class');
        expect(normGenerated).not.toContain('readonly');
    });

    it('should generate without typed properties', () => {
        const options: PhpGeneratorOptions = { ...defaultOptions, typedProperties: false };
        const generated = generatePhpCode({ "name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('public readonly $name');
    });
    
    it('should generate without fromArray/toArray/jsonSerialize methods', () => {
        const options: PhpGeneratorOptions = { ...defaultOptions, fromArray: false, toArray: false };
        const generated = generatePhpCode({ "name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).not.toContain('fromArray');
        expect(normGenerated).not.toContain('toArray');
        expect(normGenerated).not.toContain('jsonSerialize');
        expect(normGenerated).not.toContain('implements \\JsonSerializable');
    });

    it('should handle null values for arrays safely', () => {
        const jsonWithNullArray = {
            "items": [{ "name": "test"}]
        };
        const generated = generatePhpCode(jsonWithNullArray, 'Container', defaultOptions);
        const normGenerated = normalize(generated);
        
        // Ensure fromArray uses the safe check
        expect(normGenerated).toContain("is_array($data['items'] ?? null) ? array_map(fn($item) => Item::fromArray($item), $data['items']) : null");
    });
});
