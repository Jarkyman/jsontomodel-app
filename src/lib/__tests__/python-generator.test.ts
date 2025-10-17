
import { generatePythonCode, PythonGeneratorOptions } from '../python-generator';

const fullJsonInput = {
    "userId": 123,
    "userName": "testUser",
    "isActive": true,
    "createdAt": "2025-07-29T12:00:00Z",
    "userProfile": {
        "theme": "dark",
        "receive_notifications": false
    },
    "user_tags": ["alpha", "beta"],
    "projectHistory": [
        {
            "projectId": "p1",
            "projectName": "Project Phoenix"
        }
    ]
};

const defaultOptions: PythonGeneratorOptions = {
    dataclass: true,
    frozen: false,
    slots: false,
    fromDict: true,
    toDict: true,
    typeHints: true,
    defaultValues: false,
    camelCaseToSnakeCase: true,
    includeRepr: true,
    includeEq: true,
    includeHash: false,
    nestedClasses: true,
    sampleInstance: false,
};

const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('generatePythonCode', () => {

    it('should generate correct Python models with default options', () => {
        const generated = generatePythonCode(fullJsonInput, 'UserData', defaultOptions);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('from dataclasses import dataclass');
        expect(normGenerated).toContain('from typing import Any, Dict, List, Optional');
        expect(normGenerated).toContain('from datetime import datetime');
        
        expect(normGenerated).toContain('@dataclass() class UserData:');
        expect(normGenerated).toContain('user_id: Optional[int]');
        expect(normGenerated).toContain('user_name: Optional[str]');
        expect(normGenerated).toContain('is_active: Optional[bool]');
        expect(normGenerated).toContain('created_at: Optional[datetime]');
        expect(normGenerated).toContain('user_profile: Optional[UserProfile]');
        expect(normGenerated).toContain('user_tags: Optional[List[str]]');
        expect(normGenerated).toContain('project_history: Optional[List[ProjectHistory]]');
        
        expect(normGenerated).toContain('@classmethod def from_dict(cls, data: Dict[str, Any]) -> "UserData":');
        expect(normGenerated).toContain('def to_dict(self) -> Dict[str, Any]:');
        
        expect(normGenerated).toContain('@dataclass() class UserProfile:');
        expect(normGenerated).toContain('receive_notifications: Optional[bool]');

        expect(normGenerated).toContain('@dataclass() class ProjectHistory:');
        expect(normGenerated).toContain('project_id: Optional[str]');
    });

    it('should generate frozen dataclasses with tuples', () => {
        const options: PythonGeneratorOptions = { ...defaultOptions, frozen: true };
        const generated = generatePythonCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('@dataclass(frozen=True)');
        expect(normGenerated).toContain('user_tags: Optional[Tuple[str]]');
        expect(normGenerated).toContain('project_history: Optional[Tuple[ProjectHistory]]');
        expect(normGenerated).toContain('user_tags=tuple(item for item in data.get("user_tags", []))');
    });
    
    it('should generate with slots', () => {
        const options: PythonGeneratorOptions = { ...defaultOptions, slots: true };
        const generated = generatePythonCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);
        expect(normGenerated).toContain('@dataclass(slots=True)');
    });

    it('should not convert to snake_case if option is false', () => {
        const options: PythonGeneratorOptions = { ...defaultOptions, camelCaseToSnakeCase: false };
        const generated = generatePythonCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).toContain('userId: Optional[int]');
        expect(normGenerated).toContain('userName: Optional[str]');
        expect(normGenerated).toContain('projectHistory: Optional[List[ProjectHistory]]');
        
        expect(normGenerated).toContain('def from_dict(cls, data: Dict[str, Any]) -> "UserData":');
        expect(normGenerated).toContain('userId=data.get("userId"),');
        
        expect(normGenerated).toContain('def to_dict(self) -> Dict[str, Any]:');
        expect(normGenerated).toContain('"userId": self.userId,');
    });
    
    it('should generate Dict instead of nested classes if option is false', () => {
        const options: PythonGeneratorOptions = { ...defaultOptions, nestedClasses: false };
        const generated = generatePythonCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);
        
        expect(normGenerated).toContain('user_profile: Optional[Dict[str, Any]]');
        expect(normGenerated).toContain('project_history: Optional[List[Dict[str, Any]]]');
        expect(normGenerated).not.toContain('@dataclass class UserProfile:');
        expect(normGenerated).not.toContain('@dataclass class ProjectHistory:');
    });

    it('should not include from_dict or to_dict if options are false', () => {
        const options: PythonGeneratorOptions = { ...defaultOptions, fromDict: false, toDict: false };
        const generated = generatePythonCode(fullJsonInput, 'UserData', options);
        const normGenerated = normalize(generated);

        expect(normGenerated).not.toContain('def from_dict');
        expect(normGenerated).not.toContain('def to_dict');
    });

});
