import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://karthiktraders.com'

    // Static pages
    const routes = [
        '',
        '/about-us',
        '/contact',
        '/products',
        '/aerator-sets',
        '/long-arm',
        '/spares',
        '/compare',
        '/login',
        '/bulk-orders',
        '/privacy-policy',
        '/terms-conditions',
        '/refund-policy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    return routes
}
