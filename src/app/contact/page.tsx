import { Metadata } from 'next';
import { Pencil, AlertCircle, Code2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Contact Us | JSON to Model',
    description: 'Get in touch with the JSON to Model team.',
};

export default function ContactPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-20 min-h-[70vh]">
            <div className="text-center mb-16">
                <h1 className="font-headline text-5xl font-bold tracking-tight mb-4">Contact Us</h1>
                <p className="text-xl text-muted-foreground">We'd love to hear from you. How can we help?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">

                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <div className="rounded-lg bg-primary/10 p-3 h-fit w-fit mb-4">
                            <AlertCircle className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Report an Issue</CardTitle>
                        <CardDescription>
                            Found a bug in the code generation? Let us know so we can fix it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-end mt-4">
                        <a href="mailto:support@hartvigsolutions.com?subject=Bug Report" className="text-primary font-medium hover:underline inline-flex gap-2 items-center">
                            <Pencil className="h-4 w-4" /> support@hartvigsolutions.com
                        </a>
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <div className="rounded-lg bg-primary/10 p-3 h-fit w-fit mb-4">
                            <Wand2 className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Feature Requests</CardTitle>
                        <CardDescription>
                            Need a new language? Want custom serialization support? Tell us what you need.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-end mt-4">
                        <a href="mailto:support@hartvigsolutions.com?subject=Feature Request" className="text-primary font-medium hover:underline inline-flex gap-2 items-center">
                            <Pencil className="h-4 w-4" /> support@hartvigsolutions.com
                        </a>
                    </CardContent>
                </Card>

            </div>

            <div className="bg-muted/30 p-8 rounded-xl border border-border text-center max-w-2xl mx-auto">
                <Code2 className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">General Inquiries</h3>
                <p className="text-muted-foreground mb-4">For all other questions, including partnership opportunities, please email us directly.</p>
                <a href="mailto:support@hartvigsolutions.com" className="font-semibold text-lg text-primary hover:underline">
                    support@hartvigsolutions.com
                </a>
            </div>

        </main>
    );
}
