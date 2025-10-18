import { generateDartCode, DartGeneratorOptions } from '../dart-generator';

const fullOptions: DartGeneratorOptions = {
    fromJson: true,
    toJson: true,
    copyWith: true,
    toString: true,
    nullableFields: false,
    requiredFields: true,
    finalFields: true,
    defaultValues: true,
    supportDateTime: true,
    camelCaseFields: true,
    useValuesAsDefaults: false,
};

describe('generateDartCode', () => {

  it('should generate an empty class for an empty JSON object', () => {
    const jsonInput = {};
    const options: DartGeneratorOptions = {
        ...fullOptions,
        requiredFields: false,
        nullableFields: true,
        defaultValues: false
    };
    const expectedOutput = `
class EmptyModel {

  EmptyModel();

  factory EmptyModel.fromJson(Map<String, dynamic> json) {
    return EmptyModel();
  }

  Map<String, dynamic> toJson() {
    return {};
  }

  @override
  String toString() {
    return 'EmptyModel()';
  }

  EmptyModel copyWith() {
    return EmptyModel();
  }

}`;
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
    const generated = generateDartCode(jsonInput, 'EmptyModel', options);
    expect(normalize(generated)).toBe(normalize(expectedOutput));
  });
});
