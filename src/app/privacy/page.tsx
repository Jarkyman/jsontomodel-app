import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | JSON to Model',
    description: 'Privacy Policy for jsontomodel.com',
};

export default function PrivacyPolicy() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-20 min-h-[70vh]">
            <h1 className="mb-8 font-headline text-4xl font-bold tracking-tight">Privacy Policy</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <p className="text-muted-foreground">Last Updated: {new Date("2024-01-01").toLocaleDateString()}</p>

                <section>
                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
                    <p>
                        Welcome to JSON to Model ("we," "our," or "us"). We respect your privacy and are committed to protecting it.
                        This Privacy Policy explains how we handle data when you use our website, jsontomodel.com.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Processing of JSON Data</h2>
                    <p>
                        <strong>We do not collect, store, or transmit your JSON data.</strong>
                    </p>
                    <p>
                        The JSON to Model conversion tool operates entirely within your web browser (client-side).
                        Any JSON payloads, schemas, or generated code you input into the tool never leave your device
                        and are never sent to our servers. Your proprietary data remains completely private.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Local Storage</h2>
                    <p>
                        We use your browser's Local Storage to save your tool preferences (such as your chosen target programming language
                        and theme settings) to improve your experience across sessions. This data is stored locally on your device
                        and is not sent to our servers.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mt-8 mb-4">4. Third-Party Services (Analytics & Advertising)</h2>
                    <p>
                        To keep JSON to Model free for developers, we use third-party services that may collect some information:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li><strong>Google Analytics:</strong> We use Google Analytics to understand how visitors interact with our website (e.g., pages visited, time spent on the site). This helps us improve the user experience. You can opt out of Google Analytics <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">here</a>.</li>
                        <li><strong>Google AdSense:</strong> We use Google AdSense to display advertisements. Google uses cookies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://g.co/adsettings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ads Settings</a>.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mt-8 mb-4">5. Cookies</h2>
                    <p>
                        Our site uses cookies strictly for the third-party services mentioned above (Analytics and AdSense).
                        You can manage your cookie preferences through your browser settings or our cookie consent banner.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mt-8 mb-4">6. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us via our Contact page.
                    </p>
                </section>
            </div>
        </main>
    );
}
