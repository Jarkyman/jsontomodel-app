import { generateDartCode } from '../dart-generator';

describe('generateDartCode', () => {
  it('should generate correct Dart models from complex JSON', () => {
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

    const expectedOutput = `class DataModel {
  final int? id;
  final String? name;
  final String? email;
  final bool? isActive;
  final String? createdAt;
  final double? score;
  final Preferences? preferences;
  final List<String>? roles;
  final List<dynamic>? tags;
  final dynamic profilePicture;
  final Address? address;
  final List<Project>? projects;

  DataModel({
    this.id,
    this.name,
    this.email,
    this.isActive,
    this.createdAt,
    this.score,
    this.preferences,
    this.roles,
    this.tags,
    this.profilePicture,
    this.address,
    this.projects,
  });

  factory DataModel.fromJson(Map<String, dynamic> json) {
    return DataModel(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      isActive: json['is_active'],
      createdAt: json['created_at'],
      score: json['score'],
      preferences: json['preferences'] != null ? Preferences.fromJson(json['preferences']) : null,
      roles: json['roles'] != null ? List<String>.from(json['roles']) : null,
      tags: json['tags'] != null ? List<dynamic>.from(json['tags']) : null,
      profilePicture: json['profile_picture'],
      address: json['address'] != null ? Address.fromJson(json['address']) : null,
      projects: json['projects'] != null ? List<Project>.from(json['projects'].map((x) => Project.fromJson(x))) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'is_active': isActive,
      'created_at': createdAt,
      'score': score,
      'preferences': preferences?.toJson(),
      'roles': roles,
      'tags': tags,
      'profile_picture': profilePicture,
      'address': address?.toJson(),
      'projects': projects?.map((x) => x.toJson()).toList(),
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

class Notifications {
  final bool? email;
  final bool? sms;
  final bool? push;

  Notifications({
    this.email,
    this.sms,
    this.push,
  });

  factory Notifications.fromJson(Map<String, dynamic> json) {
    return Notifications(
      email: json['email'],
      sms: json['sms'],
      push: json['push'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'sms': sms,
      'push': push,
    };
  }
}

class Address {
  final String? street;
  final String? city;
  final String? zipcode;
  final Coordinates? coordinates;

  Address({
    this.street,
    this.city,
    this.zipcode,
    this.coordinates,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      street: json['street'],
      city: json['city'],
      zipcode: json['zipcode'],
      coordinates: json['coordinates'] != null ? Coordinates.fromJson(json['coordinates']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'street': street,
      'city': city,
      'zipcode': zipcode,
      'coordinates': coordinates?.toJson(),
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
      lat: json['lat'],
      lng: json['lng'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
    };
  }
}

class Project {
  final String? id;
  final String? title;
  final String? status;
  final int? budget;
  final List<Member>? members;

  Project({
    this.id,
    this.title,
    this.status,
    this.budget,
    this.members,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      title: json['title'],
      status: json['status'],
      budget: json['budget'],
      members: json['members'] != null ? List<Member>.from(json['members'].map((x) => Member.fromJson(x))) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'budget': budget,
      'members': members?.map((x) => x.toJson()).toList(),
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
}`;
    
    // Normalize whitespace for comparison
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    expect(normalize(generateDartCode(jsonInput, 'DataModel'))).toBe(normalize(expectedOutput));
  });
});
