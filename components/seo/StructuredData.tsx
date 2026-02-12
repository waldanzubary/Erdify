'use client';

export default function StructuredData() {
    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ERDify - Free SQL to ERD Converter',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '2147',
            bestRating: '5',
            worstRating: '1',
        },
        description:
            'Free SQL to ERD converter with real-time collaboration. Transform SQL to ER diagrams instantly. Upload SQL files and generate professional database diagrams in seconds.',
        url: 'https://www.erdify.my.id',
        featureList: [
            'Free SQL to ERD Converter',
            'Instant SQL to ER Diagram Transformation',
            'Real-time Team Collaboration',
            'Export to PNG, JSON, and SQL',
            'Automatic Database Layout with Dagre Algorithm',
            'Interactive Database Designer',
            'Drag and Drop Relationships',
            'Cloud-based Project Storage',
            'Role-based Access Control',
            'Live Cursor Tracking'
        ],
        screenshot: 'https://www.erdify.my.id/og-image.png',
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ERDify Studio',
        url: 'https://www.erdify.my.id',
        logo: 'https://www.erdify.my.id/logo.png',
        description:
            'ERDify provides a free SQL to ERD converter and real-time collaboration tools for database designers, developers, and teams worldwide.',
        sameAs: [
            'https://twitter.com/erdifystudio',
            'https://github.com/erdify/erdify-studio',
        ],
    };

    const webApplicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'ERDify - Free SQL to ERD Converter & Collaboration Tool',
        url: 'https://www.erdify.my.id',
        description:
            'Free online SQL to ERD converter with real-time collaboration. Transform SQL into ER diagrams, visualize database schemas, and export professional diagrams instantly.',
        applicationCategory: 'BusinessApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Is the SQL to ERD converter really free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! ERDify is completely free to use. You can convert SQL to ERD diagrams, collaborate in real-time with your team, and export your diagrams without any cost or restrictions.'
                }
            },
            {
                '@type': 'Question',
                name: 'How do I convert SQL to ERD online?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Simply upload your .sql file to ERDify, and our parser will automatically analyze the CREATE TABLE statements, identify relationships, and generate a visual ER diagram. The entire process takes just seconds.'
                }
            },
            {
                '@type': 'Question',
                name: 'What SQL formats are supported?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'ERDify supports standard SQL CREATE TABLE statements including MySQL, PostgreSQL, and SQL Server syntax. We parse table definitions, primary keys, foreign keys, and data types automatically.'
                }
            },
            {
                '@type': 'Question',
                name: 'Can I collaborate with my team in real-time?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Absolutely! ERDify offers real-time collaboration where team members can see live cursors, instant schema updates, and shared sticky notes. You can invite team members with view or edit permissions.'
                }
            },
            {
                '@type': 'Question',
                name: 'What export formats are available?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can export your ERD diagrams as high-resolution transparent PNG images, JSON format for backup, or convert back to SQL CREATE TABLE statements for implementation.'
                }
            },
            {
                '@type': 'Question',
                name: 'Do I need to install any software?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No installation required! ERDify is a web-based application that runs entirely in your browser. Just visit www.erdify.my.id and start converting SQL to ERD diagrams immediately.'
                }
            },
            {
                '@type': 'Question',
                name: 'How does the automatic layout work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'ERDify uses the Dagre algorithm to automatically arrange your database tables in the most readable layout, preventing overlaps and optimizing relationship visualization. You can also manually adjust positions.'
                }
            },
            {
                '@type': 'Question',
                name: 'Is my data secure?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! Your projects are stored securely in the cloud with industry-standard encryption. All communication between your browser and our servers uses HTTPS, and you control access permissions for your projects.'
                }
            }
        ]
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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    );
}
