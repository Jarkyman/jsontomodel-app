import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Layers, Code2, Wand2, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Developer Guides & Tutorials | JSON to Model',
    description: 'Learn best practices for data modeling, API integration, and code generation across Swift, Kotlin, TypeScript, and more.',
    keywords: 'JSON, CSV, Swift Codable, Kotlin Data Classes, TypeScript Interfaces, API integration, Code generation guides',
};

const guides = [
    {
        title: "Mastering JSON to Swift Codable",
        description: "Learn how to effortlessly parse dynamic API responses into typesafe Swift structs using the Codable protocol.",
        slug: "mastering-swift-codable",
        icon: <Layers className="h-6 w-6 text-blue-500" />,
        date: "March 1, 2026",
        readTime: "5 min read"
    },
    {
        title: "CSV vs JSON for API Integrations",
        description: "Understand the key differences between these fundamental data formats and when to choose one over the other.",
        slug: "csv-vs-json-apis",
        icon: <Code2 className="h-6 w-6 text-green-500" />,
        date: "March 2, 2026",
        readTime: "6 min read"
    },
    {
        title: "Kotlin Data Classes for Android Developers",
        description: "A deep dive into how Kotlin Data Classes simplify serialization and make defining Android API models a breeze.",
        slug: "kotlin-data-classes-android",
        icon: <Wand2 className="h-6 w-6 text-purple-500" />,
        date: "March 3, 2026",
        readTime: "4 min read"
    },
    {
        title: "Why TypeScript Interfaces matter",
        description: "Stop using 'any'. Discover how strict TypeScript interfaces protect your web applications from runtime data errors.",
        slug: "why-typescript-interfaces",
        icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
        date: "March 4, 2026",
        readTime: "5 min read"
    },
];

export default function GuidesIndexPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-20 min-h-[80vh]">
            <header className="text-center mb-16">
                <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl mb-6">Developer Guides</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    A collection of tutorials, best practices, and deep dives to help you master data serialization and build more robust applications.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {guides.map((guide) => (
                    <Link href={`/guides/${guide.slug}`} key={guide.slug} className="group flex h-full">
                        <Card className="flex flex-col h-full w-full transition-all duration-200 hover:shadow-md hover:border-primary/50 group-hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        {guide.icon}
                                    </div>
                                    <div className="flex gap-3 text-xs text-muted-foreground font-medium">
                                        <span>{guide.date}</span>
                                        <span>&bull;</span>
                                        <span>{guide.readTime}</span>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl mt-4 group-hover:text-primary transition-colors">
                                    {guide.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between">
                                <CardDescription className="text-base text-muted-foreground mb-6">
                                    {guide.description}
                                </CardDescription>
                                <div className="flex items-center text-primary font-medium text-sm mt-auto">
                                    Read Article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </main>
    );
}
