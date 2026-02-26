import { Metadata } from 'next';
import { Code2, Wand2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'About | JSON to Model',
    description: 'About the JSON to Model tool and mission.',
};

export default function AboutPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-20 min-h-[70vh]">
            <div className="text-center mb-16">
                <h1 className="font-headline text-5xl font-bold tracking-tight mb-4">About JSON to Model</h1>
                <p className="text-xl text-muted-foreground">Built by developers, for developers.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div>
                    <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                    <p className="text-lg text-muted-foreground mb-4">
                        We believe that writing boilerplate code is a waste of a developer's time. Building data models, defining types, and writing serialization logic by hand is prone to errors and slows down iteration.
                    </p>
                    <p className="text-lg text-muted-foreground">
                        JSON to Model was created to solve this single, tedious problem: turn raw API payloads into beautiful, type-safe, production-ready code in seconds.
                    </p>
                </div>
                <div className="bg-muted/30 p-8 rounded-xl border border-border">
                    <ul className="space-y-6">
                        <li className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Lightning Fast</h3>
                                <p className="text-muted-foreground">Everything runs in your browser. No server round-trips.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                                <Code2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">20+ Languages</h3>
                                <p className="text-muted-foreground">Support for Swift, Kotlin, Dart, TypeScript, and more.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                                <Wand2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Free Forever</h3>
                                <p className="text-muted-foreground">A utility built for the community, supported by unobtrusive ads.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2>Why we process data locally</h2>
                <p>
                    Unlike many other online formatting tools, JSON to Model deliberately processes all your inputs entirely on the client side.
                    As developers ourselves, we understand that you might be pasting proprietary API structures, unpublished features, or sensitive schemas.
                </p>
                <p>
                    By ensuring your code never leaves your computer, we guarantee absolute privacy and security for your intellectual property without you having to read through pages of legal fine print.
                </p>

                <div className="mt-12 flex justify-center">
                    <Link href="/">
                        <Button size="lg" className="w-full sm:w-auto">Start Generating Models</Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
