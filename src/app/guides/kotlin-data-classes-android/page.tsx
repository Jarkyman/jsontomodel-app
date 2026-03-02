import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Kotlin Data Classes for Android Developers | Developer Guide',
    description: 'Learn how to use Kotlin Data Classes with Gson or Moshi to easily models REST API payloads for robust Android applications.',
    keywords: 'Kotlin data class, Android JSON parsing, Retrofit, Kotlin Moshi, Kotlin Gson models',
};

export default function KotlinDataClassesGuide() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-20 min-h-screen">
            <Link href="/guides" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Guides
            </Link>

            <article className="prose prose-slate dark:prose-invert max-w-none">
                <header className="mb-12">
                    <div className="flex items-center gap-3 text-sm text-primary font-medium mb-4">
                        <span>March 3, 2026</span>
                        <span>&bull;</span>
                        <span>4 min read</span>
                    </div>
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                        Why Android Developers Love Kotlin Data Classes
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Gone are the days of dense Java POJOs filled with getters, setters, and `equals()` overrides. Here is how Kotlin Data classes revolutionized JSON parsing on Android.
                    </p>
                </header>

                <h2 className="text-2xl font-bold mt-12 mb-4">The Java POJO Nightmare</h2>
                <p>
                    To model a simple API response in Java, Android developers traditionally had to write (or generate) massive classes. A simple user object with three properties could easily balloon into 50 lines of boilerplate code to handle encapsulation, hashing, and string representation.
                </p>

                <h2 className="text-2xl font-bold mt-12 mb-4">The Kotlin Solution</h2>
                <p>
                    Kotlin introduced the <code>data class</code> keyword, specifically designed to hold data. The compiler automatically derives <code>equals()</code>, <code>hashCode()</code>, <code>toString()</code>, and <code>copy()</code> from all properties declared in the primary constructor.
                </p>

                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`data class User(
    val id: Int,
    val username: String,
    val isActive: Boolean
)`}</code></pre>

                <h2 className="text-2xl font-bold mt-12 mb-4">Annotations and Serialization</h2>
                <p>
                    When connecting to a backend API using Retrofit, the JSON payloads rarely use the camelCase naming convention preferred in Kotlin.
                    Depending on the serialization library you choose (Gson, Moshi, or Kotlinx Serialization), you use annotations to bridge the gap.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Using Gson (@SerializedName)</h3>
                <p>Gson is Google's classic library. It maps JSON keys to Kotlin properties using the <code>@SerializedName</code> annotation.</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`data class User(
    @SerializedName("id")
    val id: Int,
    @SerializedName("first_name")
    val firstName: String
)`}</code></pre>

                <h3 className="text-xl font-semibold mt-6 mb-3">Using Moshi (@Json)</h3>
                <p>Moshi is Square's modern alternative to Gson, heavily optimized for Kotlin.</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`@JsonClass(generateAdapter = true)
data class User(
    @Json(name = "id")
    val id: Int,
    @Json(name = "first_name")
    val firstName: String
)`}</code></pre>

                <h2 className="text-2xl font-bold mt-12 mb-4">Handling Nullability</h2>
                <p>
                    The greatest strength of Kotlin is its built-in null-safety. If an API might omit a field, you must declare it as nullable with a <code>?</code>.
                    If you don't, and the API drops the field, libraries like Moshi will immediately throw an exception, protecting your app from NullPointerExceptions deep down the stack.
                </p>

                <p>Furthermore, you can easily provide default values within the data class constructor:</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`data class Settings(
    val themeColor: String = "#FFFFFF",
    val notificationsEnabled: Boolean = true
)`}</code></pre>

                <div className="mt-12 flex justify-center">
                    <Link href="/kotlin" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2">
                        Generate Kotlin Classes from JSON <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </article>
        </main>
    );
}
