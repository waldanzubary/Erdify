'use client';

export default function StructuredData() {
    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ERDify Studio',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        description:
            'Free ERD generator with real-time collaboration. Transform SQL to ER diagrams instantly.',
        url: 'https://erdify.my.id',
        featureList: [
            'Free ERD Generator',
            'SQL to ERD Conversion',
            'Real-time Collaboration',
            'Export to PNG and JSON',
            'Auto Layout',
            'Interactive Database Designer',
        ],
        screenshot: 'https://erdify.my.id/og-image.png',
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ERDify Studio',
        url: 'https://erdify.my.id',
        logo: 'https://erdify.my.id/logo.png',
        description:
            'ERDify Studio provides free ERD generation and collaboration tools for database designers and developers.',
        sameAs: [
            'https://twitter.com/erdifystudio',
            'https://github.com/erdify/erdify-studio',
        ],
    };

    const webApplicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'ERDify Studio - Free ERD Generator',
        url: 'https://erdify.my.id',
        description:
            'Free online ERD generator with real-time collaboration, SQL to ERD conversion, and database diagram visualization.',
        applicationCategory: 'BusinessApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
            />
        </>
    );
}
