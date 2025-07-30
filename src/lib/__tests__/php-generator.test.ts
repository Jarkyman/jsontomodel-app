
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
    "profile_picture": null
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
        expect(normGenerated).toContain('final class UserData');
        
        // Check for constructor property promotion syntax
        expect(normGenerated).toContain('public function __construct( public readonly ?int $id, public readonly ?string $name, public readonly ?bool $isActive, public readonly ?\\DateTimeImmutable $createdAt, public readonly ?Preferences $preferences, public readonly ?array $roles, public readonly mixed $profilePicture, )');

        // Check for fromArray method
        expect(normGenerated).toContain('public static function fromArray(array $data): self');
        expect(normGenerated).toContain("new \\DateTimeImmutable($data['created_at'])");
        expect(normGenerated).toContain("Preferences::fromArray($data['preferences'])");

        // Check for toArray method
        expect(normGenerated).toContain('public function toArray(): array');
        expect(normGenerated).toContain("'created_at' => $this->createdAt?->format(DateTimeInterface::ATOM)");
        expect(normGenerated).toContain("'preferences' => $this->preferences?->toArray()");

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
        expect(normGenerated).toContain('$this->name = $data[\'name\'];');
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
    
    it('should generate without fromArray/toArray methods', () => {
        const options: PhpGeneratorOptions = { ...defaultOptions, fromArray: false, toArray: false };
        const generated = generatePhpCode({ "name": "Test" }, 'User', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).not.toContain('fromArray');
        expect(normGenerated).not.toContain('toArray');
    });
});

    