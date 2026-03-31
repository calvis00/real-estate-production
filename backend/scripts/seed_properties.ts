import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const mockProperties = [
    {
        title: 'Majestic 5-Bedroom Villa with Private Infinity Pool',
        description: '<b>A Sanctuary for the Extraordinary.</b><br/><br/>Designed by award-winning architects, this estate is not just a residence; it is a profound statement of success. Nestled in a private enclave where luxury meets the sea, every sunrise here is a private performance and every sunset a serene ritual.<br/><br/><b>Why This Villa is Unique:</b><br/><br/><ul><li><b>Exclusive Privacy:</b> Perimeter shielding with 24/7 elite commando protection.</li><li><b>Infinity Flow:</b> 5,000 sq.ft. of wrap-around terrace with a temperature-controlled pool.</li><li><b>Smart Ecosystem:</b> Fully automated climate, lighting, and acoustic systems.</li><li><b>Gold-Standard Interior:</b> Hand-picked Italian marble and artisanal woodwork throughout.</li></ul><br/><br/><i>This is a once-in-a-generation acquisition opportunity.</i>',
        price: 85000000,
        city: 'Chennai',
        locality: 'ECR',
        bedrooms: 5,
        bathrooms: 6,
        areaSqft: 6500,
        type: 'RESIDENTIAL_BUY',
        category: 'VILLA',
        images: [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000'
        ],
        videos: ['https://res.cloudinary.com/demo/video/upload/v1631234567/sample.mp4'],
        tags: ['Luxury', 'Sea View', 'Private Pool', 'Premium'],
        featured: true,
        verified: true
    },
    {
        title: 'Sleek 3-BHK Urban Retreat in City Center',
        description: '<b>Where the City Meets Your Front Door.</b><br/><br/>Experience the pulse of urban life without sacrificing your peace. This 3-BHK masterpiece is designed for the modern executive who values time, status, and wellness. With panoramic views of the city skyline, your home becomes the ultimate sanctuary above the clouds.<br/><br/><b>Lifestyle Hooks:</b><br/><br/><ul><li><b>Hyper-Connectivity:</b> Located exactly 2 minutes from the Metro Hub.</li><li><b>Wellness Skydeck:</b> Access to the 45th-floor infinity gym and yoga garden.</li><li><b>Designer Kitchen:</b> Fitted with German appliances and a smart modular layout.</li><li><b>Intelligent Design:</b> Zero-wastage floor plan maximizing light and ventilation.</li></ul><br/><br/><i>The future of urban living is here.</i>',
        price: 22500000,
        city: 'Chennai',
        locality: 'Gopalapuram',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 1850,
        type: 'RESIDENTIAL_BUY',
        category: 'APARTMENT',
        images: [
            'https://images.unsplash.com/photo-1545324418-f1d3c5b5a27c?auto=format&fit=crop&q=80&w=2000',
            'https://images.unsplash.com/photo-1512918766674-ed62b9043c3e?auto=format&fit=crop&q=80&w=2000'
        ],
        videos: [],
        tags: ['Urban', 'Near Metro', 'Luxury Living', 'Skyline View'],
        featured: true,
        verified: true
    },
    {
        title: 'Premium Corner Plot - Prime Opportunity in OMR',
        description: '<b>Own a Piece of the Future.</b><br/><br/>Real estate is the ultimate wealth creator, and this plot is the pinnacle of strategic investment. Located in the hyper-growth OMR corridor, this corner plot is positioned to appreciate rapidly as the city expands. It is not just land; it is your family\'s financial fortress.<br/><br/><b>Investment Highlights:</b><br/><br/><ul><li><b>High-Yield Location:</b> 30% projected annual appreciation based on local trends.</li><li><b>Ready to Build:</b> Fully cleared Title with DTCP approval and road access.</li><li><b>Gated Ecosystem:</b> Secure community with planned parks and wide internal roads.</li><li><b>Limited Inventory:</b> One of the last premium corner plots in this sector.</li></ul><br/><br/><i>Secure your wealth today for a prosperous tomorrow.</i>',
        price: 8500000,
        city: 'Chennai',
        locality: 'Siruseri',
        bedrooms: 0,
        bathrooms: 0,
        areaSqft: 2400,
        type: 'PLOT',
        category: 'PLOT',
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=2000'
        ],
        videos: [],
        tags: ['Investment', 'Clear Title', 'DTCP Approved', 'Gated Community'],
        featured: false,
        verified: true
    }
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding properties in new format...');
        for (const prop of mockProperties) {
            await client.query(
                `INSERT INTO properties (
                    title, description, price, city, locality, 
                    bedrooms, bathrooms, area_sqft, type, category, 
                    images, videos, tags, featured, verified, 
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
                [
                    prop.title, prop.description, prop.price, prop.city, prop.locality,
                    prop.bedrooms, prop.bathrooms, prop.areaSqft, prop.type, prop.category,
                    prop.images, prop.videos, prop.tags, prop.featured, prop.verified
                ]
            );
        }
        console.log(`Successfully seeded ${mockProperties.length} properties.`);
    } catch (err) {
        console.error('Seed failed with error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
