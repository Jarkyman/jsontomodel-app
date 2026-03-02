import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Mastering JSON to Swift Codable | Free Developer Guide',
    description: 'A comprehensive guide to mapping dynamic REST API JSON responses into type-safe Swift Codable structs for iOS development.',
    keywords: 'Swift Codable, JSON parsing Swift, Swift decodable, iOS development JSON, Xcode JSON models',
};

export default function SwiftCodableGuide() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-20 min-h-screen">
            <Link href="/guides" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Guides
            </Link>

            <article className="prose prose-slate dark:prose-invert max-w-none">
                <header className="mb-12">
                    <div className="flex items-center gap-3 text-sm text-primary font-medium mb-4">
                        <span>March 1, 2026</span>
                        <span>&bull;</span>
                        <span>5 min read</span>
                    </div>
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                        Mastering JSON to Swift Codable for Dynamic APIs
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Data serialization shouldn't be a bottleneck in iOS app development. Discover how the `Codable` protocol changed the game for Swift developers, and how to handle messy, dynamic JSON payloads.
                    </p>
                </header>

                <h2 className="text-2xl font-bold mt-12 mb-4">The Pain of Manual JSON Serialization</h2>
                <p>
                    Before Swift 4 introduced the `Codable` protocol, parsing JSON in iOS was notoriously cumbersome. Developers had to manually parse dictionaries (`[String: Any]`), cast values, and perform tedious optional binding. A simple typo in a string key would lead to runtime crashes.
                </p>

                <h2 className="text-2xl font-bold mt-12 mb-4">Enter Swift Codable</h2>
                <p>
                    `Codable` is actually a typealias for two protocols: `Encodable` and `Decodable`. By simply adopting this protocol, the Swift compiler automatically generates the required methods to encode to and decode from external representations like JSON.
                </p>

                <Card className="my-8 bg-muted/30 border-border">
                    <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-2">Example JSON Payload</h3>
                        <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`{
  "user_id": 98231,
  "first_name": "Sarah",
  "is_active": true,
  "last_login_date": "2026-03-01T15:00:00Z"
}`}</code></pre>
                    </CardContent>
                </Card>

                <h2 className="text-2xl font-bold mt-12 mb-4">Handling Snake Case vs Camel Case</h2>
                <p>
                    Most backend APIs return JSON keys in `snake_case` (e.g., `user_id`), but Swift conventions strongly dictate `camelCase` (e.g., `userId`) for properties.
                    You handle this in one of two ways:
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">1. The CodingKeys Enum approach</h3>
                <p>
                    You can explicitly map your Swift properties to the JSON keys using an embedded `CodingKeys` enum. This is perfect if the API keys are completely different from your variable names.
                </p>

                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`struct User: Codable {
    let id: Int
    let firstName: String
    let isActive: Bool
    
    enum CodingKeys: String, CodingKey {
        case id = "user_id"
        case firstName = "first_name"
        case isActive = "is_active"
    }
}`}</code></pre>

                <h3 className="text-xl font-semibold mt-6 mb-3">2. The Decoder keyDecodingStrategy approach</h3>
                <p>
                    If the API strictly follows snake_case and your models strictly follow camelCase, you can skip the `CodingKeys` boilerplate entirely. Just tell the `JSONDecoder` how to behave:
                </p>

                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase

let user = try decoder.decode(User.self, from: jsonData)`}</code></pre>

                <h2 className="text-2xl font-bold mt-12 mb-4">Dealing with Missing or Null Values</h2>
                <p>
                    Production APIs are rarely perfect. A field might return `null`, or be missing from the JSON payload entirely. If your Swift property is a non-optional type (e.g., `let name: String`), and the JSON field is missing, the entire decoding process will throw an error and fail.
                </p>
                <div className="bg-primary/10 border-l-4 border-primary p-4 my-6 rounded-r-lg">
                    <p className="font-semibold m-0 text-foreground">Rule of thumb:</p>
                    <p className="m-0 mt-2 text-sm text-foreground/80">If there is any chance an API field might be missing or null, ALWAYS mark the Swift property as Optional (e.g., `let profileImageUrl: String?`).</p>
                </div>

                <h2 className="text-2xl font-bold mt-12 mb-4">Automating the Boilerplate</h2>
                <p>
                    While `Codable` is powerful, writing the structs out by hand for massive JSON responses with deeply nested objects can take hours.
                </p>
                <p>
                    This is exactly why we built the JSON to Model Generator. You can paste any raw JSON directly into our generator, select <strong>Swift</strong>, and instantly receive fully-typed, nested Codable structs ready to be dropped into Xcode.
                </p>

                <div className="mt-12 flex justify-center">
                    <Link href="/swift" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2">
                        Try the Swift Model Generator <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </article>
        </main>
    );
}
