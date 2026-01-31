import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/dashboard/', '/api/'],
        },
        sitemap: 'https://karthiktraders.com/sitemap.xml',
    }
}
