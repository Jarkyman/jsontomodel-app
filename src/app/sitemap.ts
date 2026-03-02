import { MetadataRoute } from 'next';

const languages = [
    "typescript", "dart", "kotlin", "swift", "python",
    "java", "csharp", "go", "php", "javascript",
    "cpp", "vbnet", "rust", "ruby", "r",
    "objectivec", "sql", "elixir", "erlang", "scala"
];

const guides = [
    "mastering-swift-codable",
    "csv-vs-json-apis",
    "kotlin-data-classes-android",
    "why-typescript-interfaces"
];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://jsontomodel.com';

    // Base routes
    const routes = [
        '',
        '/format',
        '/guides',
        '/about',
        '/contact',
        '/privacy',
        '/terms'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // Language specific generator pages
    const languageRoutes = languages.map((lang) => ({
        url: `${baseUrl}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
    }));

    // Guide pages
    const guideRoutes = guides.map((guide) => ({
        url: `${baseUrl}/guides/${guide}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...routes, ...languageRoutes, ...guideRoutes];
}
