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
            data class Notifications(
                val email: Boolean?,
                val push: Boolean?,
                val sms: Boolean?
            )

            @Serializable
            data class Preferences(
                val newsletter: Boolean?,
                val notifications: Notifications?
            )

            @Serializable
            data class DataModel(
                val email: String?,
                val id: Int?,
                @SerialName("is_active")
                val isActive: Boolean?,
                val name: String?,
                val preferences: Preferences?,
                @SerialName("profile_picture")
                val profilePicture: JsonElement?,
                val roles: List<String>?,
                val score: Double?,
                val tags: List<JsonElement>?
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
            data class Notifications(
                val email: Boolean?,
                val push: Boolean?,
                val sms: Boolean?
            )

            data class Preferences(
                val newsletter: Boolean?,
                val notifications: Notifications?
            )

            data class DataModel(
                val email: String?,
                val id: Int?,
                val isActive: Boolean?,
                val name: String?,
                val preferences: Preferences?,
                val profilePicture: Any?,
                val roles: List<String>?,
                val score: Double?,
                val tags: List<Any>?
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
            data class Notifications(
                val email: Boolean?,
                val push: Boolean?,
                val sms: Boolean?
            ) {
                 companion object {
                    fun fromJson(json: Map<String, Any>): Notifications {
                        return Notifications(
                            email = json["email"] as? Boolean?,
                            push = json["push"] as? Boolean?,
                            sms = json["sms"] as? Boolean?
                        )
                    }
                }

                fun toJson(): Map<String, Any?> {
                    val map = mutableMapOf<String, Any?>()
                    map["email"] = email
                    map["push"] = push
                    map["sms"] = sms
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
            
            data class DataModel(
                val email: String?,
                val id: Int?,
                val isActive: Boolean?,
                val name: String?,
                val preferences: Preferences?,
                val profilePicture: Any?,
                val roles: List<String>?,
                val score: Double?,
                val tags: List<Any>?
            ) {
                companion object {
                    fun fromJson(json: Map<String, Any>): DataModel {
                        return DataModel(
                            email = json["email"] as? String?,
                            id = json["id"] as? Int?,
                            isActive = json["is_active"] as? Boolean?,
                            name = json["name"] as? String?,
                            preferences = json["preferences"]?.let { Preferences.fromJson(it as Map<String, Any>) },
                            profilePicture = json["profile_picture"] as? Any?,
                            roles = (json["roles"] as? List<*>)?.mapNotNull { it as? String },
                            score = json["score"] as? Double?,
                            tags = (json["tags"] as? List<*>)?.mapNotNull { it as? Any }
                        )
                    }
                }
            
                fun toJson(): Map<String, Any?> {
                    val map = mutableMapOf<String, Any?>()
                    map["email"] = email
                    map["id"] = id
                    map["is_active"] = isActive
                    map["name"] = name
                    map["preferences"] = preferences?.toJson()
                    map["profile_picture"] = profilePicture
                    map["roles"] = roles
                    map["score"] = score
                    map["tags"] = tags
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

            data class Notifications(
                @SerializedName("email") val email: Boolean?,
                @SerializedName("push") val push: Boolean?,
                @SerializedName("sms") val sms: Boolean?
            )

            data class Preferences(
                 @SerializedName("newsletter") val newsletter: Boolean?,
                 @SerializedName("notifications") val notifications: Notifications?
            )

            data class DataModel(
                @SerializedName("email") val email: String?,
                @SerializedName("id") val id: Int?,
                @SerializedName("is_active") val isActive: Boolean?,
                @SerializedName("name") val name: String?,
                @SerializedName("preferences") val preferences: Preferences?,
                @SerializedName("profile_picture") val profilePicture: Any?,
                @SerializedName("roles") val roles: List<String>?,
                @SerializedName("score") val score: Double?,
                @SerializedName("tags") val tags: List<Any>?
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

            data class Notifications(
                @Json(name = "email") val email: Boolean?,
                @Json(name = "push") val push: Boolean?,
                @Json(name = "sms") val sms: Boolean?
            )
            
            data class Preferences(
                @Json(name = "newsletter") val newsletter: Boolean?,
                @Json(name = "notifications") val notifications: Notifications?
            )

            data class DataModel(
                @Json(name = "email") val email: String?,
                @Json(name = "id") val id: Int?,
                @Json(name = "is_active") val isActive: Boolean?,
                @Json(name = "name") val name: String?,
                @Json(name = "preferences") val preferences: Preferences?,
                @Json(name = "profile_picture") val profilePicture: Any?,
                @Json(name = "roles") val roles: List<String>?,
                @Json(name = "score") val score: Double?,
                @Json(name = "tags") val tags: List<Any>?
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
            data class Notifications(
                val email: Boolean = false,
                val push: Boolean = false,
                val sms: Boolean = false
            )

            data class Preferences(
                val newsletter: Boolean = false,
                val notifications: Notifications = Notifications()
            )

            data class DataModel(
                val email: String = "",
                val id: Int = 0,
                val isActive: Boolean = false,
                val name: String = "",
                val preferences: Preferences = Preferences(),
                val profilePicture: Any = Any(),
                val roles: List<String> = emptyList(),
                val score: Double = 0.0,
                val tags: List<Any> = emptyList()
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
            data class Notifications(
                val email: Boolean? = null,
                val push: Boolean? = null,
                val sms: Boolean? = null
            )

            data class Preferences(
                val newsletter: Boolean? = null,
                val notifications: Notifications? = null
            )

            data class DataModel(
                val email: String? = null,
                val id: Int? = null,
                val isActive: Boolean? = null,
                val name: String? = null,
                val preferences: Preferences? = null,
                val profilePicture: Any? = null,
                val roles: List<String>? = null,
                val score: Double? = null,
                val tags: List<Any>? = null
            )
        `;

        const generated = generateKotlinCode(fullJsonInput, 'DataModel', options);
        expect(normalize(generated)).toBe(normalize(expectedOutput));
    });
});
