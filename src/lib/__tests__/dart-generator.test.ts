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
  it('should generate correct Dart models from complex JSON with default options and camelCase', () => {
    const jsonInput = {
      "id": 123,
      "name": "Test User",
      "email": "test@example.com",
      "is_active": true,
      "created_at": "2025-07-29T12:00:00Z",
      "score": 89.75,
      "preferences": {
        "newsletter": false,
        "notifications": {
          "email": true,
          "sms": false,
          "push": true
        }
      },
      "roles": ["admin", "editor", "viewer"],
      "tags": [],
      "profile_picture": null,
      "address": {
        "street": "123 Example St",
        "city": "Copenhagen",
        "zipcode": "2100",
        "coordinates": {
          "lat": 55.6761,
          "lng": 12.5683
        }
      },
      "projects": [
        {
          "id": "p1",
          "title": "Website Redesign",
          "status": "active",
          "budget": 10000,
          "members": [
            {
              "id": "u1",
              "name": "Alice"
            },
            {
              "id": "u2",
              "name": "Bob"
            }
          ]
        },
        {
          "id": "p2",
          "title": "Mobile App",
          "status": "planning",
          "budget": 5000,
          "members": []
        }
      ]
    };
    
    const defaultOptions: DartGeneratorOptions = {
        fromJson: true,
        toJson: true,
        copyWith: false,
        toString: false,
        nullableFields: true,
        requiredFields: false,
        finalFields: true,
        defaultValues: false,
        supportDateTime: true,
        camelCaseFields: true,
        useValuesAsDefaults: false,
    };

    const expectedOutput = `class Address {
  final String? city;
  final Coordinates? coordinates;
  final String? street;
  final String? zipcode;

  Address({
    this.city,
    this.coordinates,
    this.street,
    this.zipcode,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      city: json['city'],
      coordinates: json['coordinates'] != null ? Coordinates.fromJson(json['coordinates']) : null,
      street: json['street'],
      zipcode: json['zipcode'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'city': city,
      'coordinates': coordinates?.toJson(),
      'street': street,
      'zipcode': zipcode,
    };
  }
}

class Coordinates {
  final double? lat;
  final double? lng;

  Coordinates({
    this.lat,
    this.lng,
  });

  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      lat: json['lat']?.toDouble(),
      lng: json['lng']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
    };
  }
}

class DataModel {
  final Address? address;
  final DateTime? createdAt;
  final String? email;
  final int? id;
  final bool? isActive;
  final String? name;
  final Preferences? preferences;
  final List<Project>? projects;
  final dynamic? profilePicture;
  final List<String>? roles;
  final double? score;
  final List<dynamic>? tags;

  DataModel({
    this.address,
    this.createdAt,
    this.email,
    this.id,
    this.isActive,
    this.name,
    this.preferences,
    this.projects,
    this.profilePicture,
    this.roles,
    this.score,
    this.tags,
  });

  factory DataModel.fromJson(Map<String, dynamic> json) {
    return DataModel(
      address: json['address'] != null ? Address.fromJson(json['address']) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      email: json['email'],
      id: json['id'],
      isActive: json['is_active'],
      name: json['name'],
      preferences: json['preferences'] != null ? Preferences.fromJson(json['preferences']) : null,
      projects: json['projects'] != null ? List<Project>.from(json['projects'].map((x) => Project.fromJson(x))) : null,
      profilePicture: json['profile_picture'],
      roles: json['roles'] != null ? List<String>.from(json['roles']) : null,
      score: json['score']?.toDouble(),
      tags: json['tags'] != null ? List<dynamic>.from(json['tags']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address?.toJson(),
      'created_at': createdAt?.toIso8601String(),
      'email': email,
      'id': id,
      'is_active': isActive,
      'name': name,
      'preferences': preferences?.toJson(),
      'profile_picture': profilePicture,
      'projects': projects?.map((x) => x.toJson()).toList(),
      'roles': roles,
      'score': score,
      'tags': tags,
    };
  }
}

class Member {
  final String? id;
  final String? name;

  Member({
    this.id,
    this.name,
  });

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['id'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class Notifications {
  final bool? email;
  final bool? push;
  final bool? sms;

  Notifications({
    this.email,
    this.push,
    this.sms,
  });

  factory Notifications.fromJson(Map<String, dynamic> json) {
    return Notifications(
      email: json['email'],
      push: json['push'],
      sms: json['sms'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'push': push,
      'sms': sms,
    };
  }
}

class Preferences {
  final bool? newsletter;
  final Notifications? notifications;

  Preferences({
    this.newsletter,
    this.notifications,
  });

  factory Preferences.fromJson(Map<String, dynamic> json) {
    return Preferences(
      newsletter: json['newsletter'],
      notifications: json['notifications'] != null ? Notifications.fromJson(json['notifications']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'newsletter': newsletter,
      'notifications': notifications?.toJson(),
    };
  }
}

class Project {
  final int? budget;
  final String? id;
  final List<Member>? members;
  final String? status;
  final String? title;

  Project({
    this.budget,
    this.id,
    this.members,
    this.status,
    this.title,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      budget: json['budget'],
      id: json['id'],
      members: json['members'] != null ? List<Member>.from(json['members'].map((x) => Member.fromJson(x))) : null,
      status: json['status'],
      title: json['title'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'budget': budget,
      'id': id,
      'members': members?.map((x) => x.toJson()).toList(),
      'status': status,
      'title': title,
    };
  }
}`;
    
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
    const generated = generateDartCode(jsonInput, 'DataModel', defaultOptions);
    expect(normalize(generated)).toBe(normalize(expectedOutput));
  });

  it('should generate code with all options enabled', () => {
    const jsonInput = {
      "user_id": 1,
      "user_name": "test",
      "registered_at": "2023-01-01T00:00:00.000Z",
      "is_premium": true,
    };

    const expectedOutput = `
class AllOptions {
  final bool isPremium;
  final DateTime registeredAt;
  final int userId;
  final String userName;

  AllOptions({
    required this.isPremium,
    required this.registeredAt,
    required this.userId,
    required this.userName,
  });

  factory AllOptions.fromJson(Map<String, dynamic> json) {
    return AllOptions(
      isPremium: json['is_premium'] ?? false,
      registeredAt: json['registered_at'] != null ? DateTime.parse(json['registered_at']) : DateTime.now(),
      userId: json['user_id'] ?? 0,
      userName: json['user_name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'is_premium': isPremium,
      'registered_at': registeredAt.toIso8601String(),
      'user_id': userId,
      'user_name': userName,
    };
  }

  @override
  String toString() {
    return 'AllOptions(isPremium: $isPremium, registeredAt: $registeredAt, userId: $userId, userName: $userName)';
  }

  AllOptions copyWith({
    bool? isPremium,
    DateTime? registeredAt,
    int? userId,
    String? userName,
  }) {
    return AllOptions(
      isPremium: isPremium ?? this.isPremium,
      registeredAt: registeredAt ?? this.registeredAt,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
    );
  }
}
`;
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
    const generated = generateDartCode(jsonInput, 'AllOptions', fullOptions);
    expect(normalize(generated)).toBe(normalize(expectedOutput));
  });

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

  it('should handle required and nullable fields correctly', () => {
    const jsonInput = {"name": "John Doe", "age": null};
    const options: DartGeneratorOptions = {
        ...fullOptions,
        requiredFields: true,
        nullableFields: true,
        defaultValues: false,
    };
    const expectedOutput = `
class User {
  final dynamic? age;
  final String? name;

  User({
    required this.age,
    required this.name,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      age: json['age'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'age': age,
      'name': name,
    };
  }

  @override
  String toString() {
    return 'User(age: $age, name: $name)';
  }

  User copyWith({
    dynamic? age,
    String? name,
  }) {
    return User(
      age: age ?? this.age,
      name: name ?? this.name,
    );
  }
}
`;
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
    const generated = generateDartCode(jsonInput, 'User', options);
    expect(normalize(generated)).toBe(normalize(expectedOutput));
  });

  it('should use values from JSON as defaults when useValuesAsDefaults is true', () => {
    const jsonInput = {
        "id": 123,
        "name": "Default Name",
        "is_enabled": true
    };
    const options: DartGeneratorOptions = {
        ...fullOptions,
        requiredFields: false,
        nullableFields: false,
        defaultValues: true,
        useValuesAsDefaults: true,
    };
    const expectedOutput = `
class Config {
  final int id;
  final bool isEnabled;
  final String name;

  Config({
    this.id = 123,
    this.isEnabled = true,
    this.name = 'Default Name',
  });

  factory Config.fromJson(Map<String, dynamic> json) {
    return Config(
      id: json['id'] ?? 123,
      isEnabled: json['is_enabled'] ?? true,
      name: json['name'] ?? 'Default Name',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'is_enabled': isEnabled,
      'name': name,
    };
  }

  @override
  String toString() {
    return 'Config(id: $id, isEnabled: $isEnabled, name: $name)';
  }

  Config copyWith({
    int? id,
    bool? isEnabled,
    String? name,
  }) {
    return Config(
      id: id ?? this.id,
      isEnabled: isEnabled ?? this.isEnabled,
      name: name ?? this.name,
    );
  }
}
`;
      const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
      const generated = generateDartCode(jsonInput, 'Config', options);
      expect(normalize(generated)).toBe(normalize(expectedOutput));
  });
});
