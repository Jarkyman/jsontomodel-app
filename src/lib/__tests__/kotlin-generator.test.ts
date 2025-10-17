import { generateKotlinCode, KotlinGeneratorOptions } from '../kotlin-generator';

const fullJsonInput = {
    "id": 123,
    "name": "Test User",
    "email": "test@example.com",
    "is_active": true,
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
    "profile_picture": null
};

describe('generateKotlinCode', () => {

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    it('should generate correct code for kotlinx (default)', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'kotlinx',
            dataClass: true,
            useVal: true,
            nullable: true,
            defaultValues: false,
            defaultToNull: false,
        };

        const expectedOutput = `
            import kotlinx.serialization.SerialName
            import kotlinx.serialization.Serializable
            import kotlinx.serialization.json.JsonElement

            @Serializable
            data class DataModel(
                val id: Int?,
                val name: String?,
                val email: String?,
                @SerialName("is_active")
                val isActive: Boolean?,
                val score: Double?,
                val preferences: Preferences?,
                val roles: List<String>?,
                val tags: List<JsonElement>?,
                @SerialName("profile_picture")
                val profilePicture: JsonElement?
            )

            @Serializable
            data class Preferences(
                val newsletter: Boolean?,
                val notifications: Notifications?
            )

            @Serializable
            data class Notifications(
                val email: Boolean?,
                val sms: Boolean?,
                val push: Boolean?
            )
        `;
        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });

    it('should generate correct code for "none" serialization', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'none',
            dataClass: true,
            useVal: true,
            nullable: true,
            defaultValues: false,
            defaultToNull: false,
        };
        const expectedOutput = `
            data class DataModel(
                val id: Int?,
                val name: String?,
                val email: String?,
                val isActive: Boolean?,
                val score: Double?,
                val preferences: Preferences?,
                val roles: List<String>?,
                val tags: List<Any>?,
                val profilePicture: Any?
            )

            data class Preferences(
                val newsletter: Boolean?,
                val notifications: Notifications?
            )

            data class Notifications(
                val email: Boolean?,
                val sms: Boolean?,
                val push: Boolean?
            )
        `;
        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });

    it('should generate correct code for "manual" serialization', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'manual',
            dataClass: true,
            useVal: true,
            nullable: true,
            defaultValues: false,
            defaultToNull: false,
        };

        const expectedOutput = `
            data class DataModel(
                val id: Int?,
                val name: String?,
                val email: String?,
                val isActive: Boolean?,
                val score: Double?,
                val preferences: Preferences?,
                val roles: List<String>?,
                val tags: List<Any>?,
                val profilePicture: Any?
            ) {
                companion object {
                    fun fromJson(json: Map<String, Any>): DataModel {
                        return DataModel(
                            id = json["id"] as? Int?,
                            name = json["name"] as? String?,
                            email = json["email"] as? String?,
                            isActive = json["is_active"] as? Boolean?,
                            score = json["score"] as? Double?,
                            preferences = json["preferences"]?.let { Preferences.fromJson(it as Map<String, Any>) },
                            roles = (json["roles"] as? List<*>)?.mapNotNull { it as String },
                            tags = (json["tags"] as? List<*>)?.mapNotNull { it as Any },
                            profilePicture = json["profile_picture"] as? Any?
                        )
                    }
                }
            
                fun toJson(): Map<String, Any?> {
                    val map = mutableMapOf<String, Any?>()
                    map["id"] = id
                    map["name"] = name
                    map["email"] = email
                    map["is_active"] = isActive
                    map["score"] = score
                    map["preferences"] = preferences?.toJson()
                    map["roles"] = roles
                    map["tags"] = tags
                    map["profile_picture"] = profilePicture
                    return map.filterValues { it != null }
                }
            }

            data class Preferences(
                val newsletter: Boolean?,
                val notifications: Notifications?
            ) {
                 companion object {
                    fun fromJson(json: Map<String, Any>): Preferences {
                        return Preferences(
                            newsletter = json["newsletter"] as? Boolean?,
                            notifications = json["notifications"]?.let { Notifications.fromJson(it as Map<String, Any>) }
                        )
                    }
                }

                fun toJson(): Map<String, Any?> {
                    val map = mutableMapOf<String, Any?>()
                    map["newsletter"] = newsletter
                    map["notifications"] = notifications?.toJson()
                    return map.filterValues { it != null }
                }
            }

            data class Notifications(
                val email: Boolean?,
                val sms: Boolean?,
                val push: Boolean?
            ) {
                 companion object {
                    fun fromJson(json: Map<String, Any>): Notifications {
                        return Notifications(
                            email = json["email"] as? Boolean?,
                            sms = json["sms"] as? Boolean?,
                            push = json["push"] as? Boolean?
                        )
                    }
                }

                fun toJson(): Map<String, Any?> {
                    val map = mutableMapOf<String, Any?>()
                    map["email"] = email
                    map["sms"] = sms
                    map["push"] = push
                    return map.filterValues { it != null }
                }
            }
        `;
        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });

    it('should generate correct code for "gson"', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'gson',
            dataClass: true,
            useVal: true,
            nullable: true,
            defaultValues: false,
            defaultToNull: false,
        };
        const expectedOutput = `
            import com.google.gson.annotations.SerializedName

            data class DataModel(
                @SerializedName("id") val id: Int?,
                @SerializedName("name") val name: String?,
                @SerializedName("email") val email: String?,
                @SerializedName("is_active") val isActive: Boolean?,
                @SerializedName("score") val score: Double?,
                @SerializedName("preferences") val preferences: Preferences?,
                @SerializedName("roles") val roles: List<String>?,
                @SerializedName("tags") val tags: List<Any>?,
                @SerializedName("profile_picture") val profilePicture: Any?
            )

            data class Preferences(
                 @SerializedName("newsletter") val newsletter: Boolean?,
                 @SerializedName("notifications") val notifications: Notifications?
            )
            
            data class Notifications(
                @SerializedName("email") val email: Boolean?,
                @SerializedName("sms") val sms: Boolean?,
                @SerializedName("push") val push: Boolean?
            )
        `;
        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });

    it('should generate correct code for "moshi"', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'moshi',
            dataClass: true,
            useVal: true,
            nullable: true,
            defaultValues: false,
            defaultToNull: false,
        };
        const expectedOutput = `
            import com.squareup.moshi.Json

            data class DataModel(
                @Json(name = "id") val id: Int?,
                @Json(name = "name") val name: String?,
                @Json(name = "email") val email: String?,
                @Json(name = "is_active") val isActive: Boolean?,
                @Json(name = "score") val score: Double?,
                @Json(name = "preferences") val preferences: Preferences?,
                @Json(name = "roles") val roles: List<String>?,
                @Json(name = "tags") val tags: List<Any>?,
                @Json(name = "profile_picture") val profilePicture: Any?
            )
            
            data class Preferences(
                @Json(name = "newsletter") val newsletter: Boolean?,
                @Json(name = "notifications") val notifications: Notifications?
            )

            data class Notifications(
                @Json(name = "email") val email: Boolean?,
                @Json(name = "sms") val sms: Boolean?,
                @Json(name = "push") val push: Boolean?
            )
        `;
        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });


    it('should generate correct code with default values', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'none',
            dataClass: true,
            useVal: true,
            nullable: false,
            defaultValues: true,
            defaultToNull: false,
        };

        const expectedOutput = `
            data class DataModel(
                val id: Int = 0,
                val name: String = "",
                val email: String = "",
                val isActive: Boolean = false,
                val score: Double = 0.0,
                val preferences: Preferences = Preferences(),
                val roles: List<String> = emptyList(),
                val tags: List<Any> = emptyList(),
                val profilePicture: Any = Any()
            )

            data class Preferences(
                val newsletter: Boolean = false,
                val notifications: Notifications = Notifications()
            )

            data class Notifications(
                val email: Boolean = false,
                val sms: Boolean = false,
                val push: Boolean = false
            )
        `;

        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });

    it('should generate correct code with defaultToNull', () => {
        const options: KotlinGeneratorOptions = {
            serializationLibrary: 'none',
            dataClass: true,
            useVal: true,
            nullable: true,
            defaultValues: false,
            defaultToNull: true,
        };

        const expectedOutput = `
            data class DataModel(
                val id: Int? = null,
                val name: String? = null,
                val email: String? = null,
                val isActive: Boolean? = null,
                val score: Double? = null,
                val preferences: Preferences? = null,
                val roles: List<String>? = null,
                val tags: List<Any>? = null,
                val profilePicture: Any? = null
            )

            data class Preferences(
                val newsletter: Boolean? = null,
                val notifications: Notifications? = null
            )
            
            data class Notifications(
                val email: Boolean? = null,
                val sms: Boolean? = null,
                val push: Boolean? = null
            )
        `;

        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });
});
