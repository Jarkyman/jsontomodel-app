"use client";

import { useState } from "react";
import { Copy, Layers, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { parseCsvToJson, isLikelyCsv } from "@/lib/csv-parser";
import { ThemeToggle } from "@/components/theme-toggle";
import { DragDropZone } from "@/components/DragDropZone";

export default function FormatClient() {
    const { toast } = useToast();
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [hasCopied, setHasCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFormat = () => {
        if (!input.trim()) {
            setError(null);
            setOutput("");
            return;
        }

        try {
            if (isLikelyCsv(input)) {
                const csvData = parseCsvToJson(input);
                if (csvData) {
                    setOutput(JSON.stringify(csvData, null, 2));
                    setError(null);
                    toast({
                        title: "Success",
                        description: "CSV converted to JSON array.",
                    });
                    return;
                }
            }

            // Try JSON
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed, null, 2));
            setError(null);
            toast({
                title: "Success",
                description: "JSON formatted successfully.",
            });
        } catch (e) {
            setError("Invalid input. Please ensure it is valid JSON or CSV data.");
            setOutput("");
        }
    };

    const handleCopy = () => {
        if (output) {
            navigator.clipboard.writeText(output);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
            toast({
                title: "Copied",
                description: "Formatting results copied to clipboard.",
            });
        }
    };

    return (
        <DragDropZone onFileDrop={setInput}>
            <main className="relative min-h-screen bg-background">
                <div className="absolute right-4 top-4">
                    <ThemeToggle />
                </div>

                <section className="px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
                        <div className="text-center">
                            <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                                JSON Formatter & CSV Converter
                            </h1>
                            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                                Prettify messy JSON payloads or convert CSV spreadsheets into clean JSON arrays. Free, local, and secure.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="flex flex-col h-full min-h-[500px]">
                                <CardHeader>
                                    <CardTitle>Input Data</CardTitle>
                                    <CardDescription>Paste your raw JSON or CSV data here</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="[{&#34;name&#34;: &#34;Alice&#34;}] or id,name&#10;1,Alice"
                                        className="font-code flex-1 min-h-[400px] resize-none border-border bg-muted/50 p-4 shadow-sm"
                                    />
                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    <Button onClick={handleFormat} className="w-full gap-2">
                                        <Layers className="h-4 w-4" />
                                        Format & Convert
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col h-full min-h-[500px]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle>Output</CardTitle>
                                        <CardDescription>Formatted JSON result</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        disabled={!output}
                                        className="gap-2"
                                    >
                                        {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {hasCopied ? "Copied" : "Copy"}
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 relative min-h-[400px]">
                                    <div className="absolute inset-0 overflow-auto bg-muted/30 p-4">
                                        <pre className="font-code text-sm text-foreground">
                                            <code>{output || "// Output will appear here"}</code>
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Heavy SEO Content section specifically for AdSense Approval */}
                <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border mt-8 bg-muted/10">
                    <div className="mx-auto w-full max-w-4xl prose prose-slate dark:prose-invert">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-8">
                            Complete Guide to JSON Formatting and CSV Conversion
                        </h2>

                        <p className="lead text-lg text-muted-foreground mb-8">
                            Whether you are working with an API that returned a minified string, or you need to process a spreadsheet export for your next web application, having the right data formatting tool is critical. Our free browser-based JSON Formatter and CSV to JSON converter solves this without tracking your data.
                        </p>

                        <h3 className="text-2xl font-bold mt-12 mb-4">Why Do You Need a JSON Formatter?</h3>
                        <p>
                            JSON (JavaScript Object Notation) is the standard format for data exchange on the modern web. However, to save bandwidth, most APIs return JSON in a "minified" format—a single, massive string with all spaces and line breaks removed. While this is efficient for computers, it is nearly impossible for developers to read or debug.
                        </p>
                        <p>
                            Our tool acts as a "JSON Prettifier", taking that dense block of text and automatically indenting it, adding necessary line breaks, and making the data structure visually apparent. By formatting your code cleanly, you can easily spot missing brackets, identify nested structures, and verify the integrity of the payload.
                        </p>

                        <h3 className="text-2xl font-bold mt-12 mb-4">Converting CSV to JSON</h3>
                        <p>
                            CSV (Comma-Separated Values) remains the universal language of spreadsheets and databases. Analysts and business operators frequently export data from Excel or Google Sheets into CSV format. Yet, the majority of modern frontend and backend frameworks require data to be structured as JSON arrays.
                        </p>
                        <p>
                            Writing scripts to convert this data manually is tedious and error-prone. Our integrated CSV converter solves this instantly. Simply paste your raw CSV data (ensuring your first row contains the headers), and our engine will parse it and spit out a fully formatted JSON array of objects, recognizing numbers, booleans, and strings automatically.
                        </p>

                        <h3 className="text-2xl font-bold mt-12 mb-4">Data Privacy and Security</h3>
                        <p>
                            When dealing with production data, security is paramount. Sending internal API responses or confidential CSV exports to random third-party servers is a massive privacy risk. That is why our JSON Formatter and CSV Converter are engineered to execute entirely locally within your web browser.
                        </p>
                        <p>
                            We do not store, track, or analyze your inputted data. What happens on your machine stays on your machine, ensuring complete compliance with privacy best practices.
                        </p>
                    </div>
                </section>
            </main>
        </DragDropZone>
    );
}
