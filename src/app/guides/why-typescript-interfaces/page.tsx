import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Why TypeScript Interfaces Matter | Developer Guide',
    description: 'Stop using the any keyword. Learn how to map JSON API responses to strict TypeScript interfaces for scalable web apps.',
    keywords: 'TypeScript interfaces, TypeScript parsing JSON, React API calls, Next.js typing APIs',
};

export default function TypeScriptInterfacesGuide() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-20 min-h-screen">
            <Link href="/guides" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Guides
            </Link>

            <article className="prose prose-slate dark:prose-invert max-w-none">
                <header className="mb-12">
                    <div className="flex items-center gap-3 text-sm text-primary font-medium mb-4">
                        <span>March 4, 2026</span>
                        <span>&bull;</span>
                        <span>5 min read</span>
                    </div>
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                        Stop Using `any`: Why TypeScript Interfaces Matter
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        It's tempting to use <code>any</code> when parsing unknown JSON from an API. But doing so defeats the entire purpose of TypeScript. Here is how to wrangle messy data properly.
                    </p>
                </header>

                <h2 className="text-2xl font-bold mt-12 mb-4">The Problem with `any`</h2>
                <p>
                    When you fetch data using <code>const response = await fetch('/api/data').then(res =&gt; res.json())</code>, the resulting <code>response</code> object is essentially cast to <code>any</code>.
                    This means the TypeScript compiler has no idea what properties exist on the object.
                </p>

                <p>
                    If the API returns a property called <code>first_name</code>, but you accidentally type <code>response.firstName</code> in your React component, TypeScript will not show an error in your IDE. Your app will simply crash in production when it tries to render undefined data.
                </p>

                <h2 className="text-2xl font-bold mt-12 mb-4">The Interface Solution</h2>
                <p>
                    Interfaces allow you to declare the exact shape of an object. When you fetch JSON data, you explicitly cast the result to your interface:
                </p>

                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`export interface User {
    id: number;
    email: string;
    isActive: boolean;
    createdAt?: string; // Optional field
}

// Later in your data fetching logic...
const user = await res.json() as User;
console.log(user.email); // IDE autocompletes perfectly!`}</code></pre>

                <h2 className="text-2xl font-bold mt-12 mb-4">Handling Deeply Nested Objects</h2>
                <p>
                    Most APIs return deeply nested structures. Instead of creating one giant interface, you should compose smaller interfaces together.
                </p>

                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border font-mono"><code>{`export interface GeoBlock {
    lat: number;
    lng: number;
}

export interface Address {
    street: string;
    city: string;
    geo: GeoBlock;
}

export interface Company {
    name: string;
    catchPhrase: string;
}

export interface UserResponse {
    id: number;
    name: string;
    address: Address;
    company: Company;
}`}</code></pre>

                <h2 className="text-2xl font-bold mt-12 mb-4">Don't Write Boilerplate By Hand</h2>
                <p>
                    Defining interfaces for a 200-line JSON payload from a third-party API is soul-crushing work. You will inevitably misspell a key, miss an optional property, or incorrectly infer a type (like assuming an ID is a number when it's actually a UUID string).
                </p>
                <p>
                    Instead of hand-coding interfaces, professional developers use tools like the JSON to Model Generator. You paste your raw JSON, and the engine recursively traverses the data tree, identifies data types, separates nested objects, and names your interfaces perfectly.
                </p>

                <div className="mt-12 flex justify-center">
                    <Link href="/typescript" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2">
                        Generate TypeScript Interfaces <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </article>
        </main>
    );
}
