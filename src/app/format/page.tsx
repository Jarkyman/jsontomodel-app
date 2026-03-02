import type { Metadata } from "next";
import FormatClient from "./FormatClient";

export const metadata: Metadata = {
    title: "JSON Formatter & CSV to JSON Converter | JSON to Model",
    description:
        "Free online tool to format JSON, prettify JSON payloads, and convert CSV data into JSON arrays instantly directly in your browser.",
    keywords: [
        "json formatter",
        "csv to json",
        "format json",
        "prettify json",
        "json converter",
        "csv converter"
    ],
};

export default function FormatPage() {
    return <FormatClient />;
}
