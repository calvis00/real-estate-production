import { sql } from 'drizzle-orm';
import { db } from './index.js';
import { contacts, leads, listingRequests, properties } from './schema.js';

const mockProperties = [
  {
    title: 'Majestic 5-Bedroom Villa with Private Infinity Pool',
    description:
      '<b>A Sanctuary for the Extraordinary.</b><br/><br/>Designed by award-winning architects, this estate is not just a residence; it is a profound statement of success. Nestled in a private enclave where luxury meets the sea, every sunrise here is a private performance and every sunset a serene ritual.<br/><br/><b>Highlights:</b><ul><li>Private infinity pool</li><li>Sea-facing deck</li><li>Full smart-home controls</li><li>Premium imported finishes</li></ul>',
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
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000',
    ],
    videos: [],
    tags: ['Luxury', 'Sea View', 'Private Pool', 'Smart Home'],
    featured: true,
    verified: true,
    status: 'ACTIVE',
  },
  {
    title: 'Botanical 3-BHK Apartment in Nungambakkam',
    description:
      '<b>Urban comfort with calm interiors.</b><br/><br/>This apartment blends central-city convenience with airy layouts, natural light, and refined common amenities. Ideal for professionals who want a polished address near schools, hospitals, and metro links.',
    price: 24000000,
    city: 'Chennai',
    locality: 'Nungambakkam',
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2200,
    type: 'RESIDENTIAL_BUY',
    category: 'APARTMENT',
    images: [
      'https://images.unsplash.com/photo-1545324418-f1d3c5b5a27c?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=2000',
    ],
    videos: [],
    tags: ['Metro Access', 'Premium Tower', 'City View'],
    featured: true,
    verified: true,
    status: 'ACTIVE',
  },
  {
    title: 'Premium Corner Plot in Siruseri Growth Corridor',
    description:
      '<b>Own a strategic parcel in a fast-growing belt.</b><br/><br/>A ready-to-build corner plot with clean access roads, investor appeal, and strong upside as the corridor matures.',
    price: 8500000,
    city: 'Chennai',
    locality: 'Siruseri',
    bedrooms: 0,
    bathrooms: 0,
    areaSqft: 2400,
    type: 'PLOT',
    category: 'PLOT',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=2000',
    ],
    videos: [],
    tags: ['Corner Plot', 'DTCP Ready', 'Investment'],
    featured: false,
    verified: true,
    status: 'ACTIVE',
  },
  {
    title: '4-BHK Villa for Rent in Perungudi',
    description:
      '<b>Large-format family home in a gated enclave.</b><br/><br/>A well-maintained villa with landscaped outdoor space, staff utility area, and quick access to IT parks.',
    price: 180000,
    city: 'Chennai',
    locality: 'Perungudi',
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3200,
    type: 'RESIDENTIAL_RENT',
    category: 'VILLA',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=2000',
    ],
    videos: [],
    tags: ['Rental', 'Gated Community', 'IT Corridor'],
    featured: false,
    verified: true,
    status: 'ACTIVE',
  },
  {
    title: 'Modern Commercial Office Floor in OMR',
    description:
      '<b>Designed for high-performance teams.</b><br/><br/>Open floorplates, meeting zones, power backup, and excellent arterial-road connectivity make this a strong option for growing businesses.',
    price: 56000000,
    city: 'Chennai',
    locality: 'OMR',
    bedrooms: 0,
    bathrooms: 4,
    areaSqft: 7200,
    type: 'COMMERCIAL',
    category: 'OFFICE',
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&q=80&w=2000',
    ],
    videos: [],
    tags: ['Office Space', 'Business Ready', 'Prime Location'],
    featured: true,
    verified: true,
    status: 'ACTIVE',
  },
  {
    title: 'Designer Penthouse in Adyar',
    description:
      '<b>An elevated private residence with skyline views.</b><br/><br/>A statement penthouse with terrace lounge, double-height living zone, and high-end fit-out curated for premium buyers.',
    price: 48000000,
    city: 'Chennai',
    locality: 'Adyar',
    bedrooms: 4,
    bathrooms: 5,
    areaSqft: 4100,
    type: 'RESIDENTIAL_BUY',
    category: 'APARTMENT',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=2000',
    ],
    videos: [],
    tags: ['Penthouse', 'Skyline View', 'Private Terrace'],
    featured: false,
    verified: true,
    status: 'SOLD',
  },
];

const mockLeads = [
  {
    customerName: 'Anand Kumar',
    phone: '9840123456',
    email: 'anand.k@example.com',
    requirementText: 'Looking for a 3BHK apartment in OMR near major IT parks with premium amenities.',
    propertyType: 'Apartment',
    preferredLocation: 'OMR',
    budgetMin: 8500000,
    budgetMax: 12500000,
    status: 'NEW',
    priority: 'HIGH',
    source: 'PHONE',
    notes: 'Prefers higher floors and clubhouse access.',
  },
  {
    customerName: 'Meera Reddy',
    phone: '9988776655',
    email: 'meera.r@example.com',
    requirementText: 'Interested in a residential plot near ECR for long-term investment.',
    propertyType: 'Plot',
    preferredLocation: 'ECR',
    budgetMin: 4000000,
    budgetMax: 6500000,
    status: 'CONTACTED',
    priority: 'MEDIUM',
    source: 'WALK_IN',
    notes: 'Needs legal-document clarity before site visit.',
  },
  {
    customerName: 'Rahul Dravid',
    phone: '8111222333',
    email: 'rahul.d@example.com',
    requirementText: 'Wants farmland or land parcel near Kanchipuram for a weekend retreat project.',
    propertyType: 'Land',
    preferredLocation: 'Kanchipuram',
    budgetMin: 8000000,
    budgetMax: 15000000,
    status: 'IN_PROGRESS',
    priority: 'LOW',
    source: 'REFERRAL',
    notes: 'Looking for organic farming potential.',
  },
  {
    customerName: 'Lakshmi Narayan',
    phone: '9444112233',
    email: 'lakshmi.n@example.com',
    requirementText: 'Needs a ready-to-occupy duplex in Adyar with good ventilation and covered parking.',
    propertyType: 'Duplex',
    preferredLocation: 'Adyar',
    budgetMin: 20000000,
    budgetMax: 35000000,
    status: 'NEED_TO_RECALL',
    priority: 'HIGH',
    source: 'HERO_SEARCH',
    notes: 'Urgent move expected next month.',
  },
];

const mockContacts = [
  {
    customerName: 'Jane Cooper',
    phone: '9840234567',
    email: 'jane.cooper@example.com',
    requirementText: 'Interested in sustainable villa design consultation for a 2400 sqft plot.',
    propertyType: 'Villa',
    preferredLocation: 'ECR, Chennai',
    budgetMin: 15000000,
    budgetMax: 25000000,
    status: 'NEW',
    priority: 'HIGH',
    source: 'NAV_CONTACT',
    notes: 'Wants a callback from the design advisory team.',
  },
  {
    customerName: 'Robert Fox',
    phone: '9840345678',
    email: 'robert.fox@example.com',
    requirementText: 'Looking for renovation guidance for an older luxury penthouse.',
    propertyType: 'Penthouse',
    preferredLocation: 'Adyar',
    budgetMin: 5000000,
    budgetMax: 10000000,
    status: 'CONTACTED',
    priority: 'MEDIUM',
    source: 'NAV_CONTACT',
    notes: 'Interested in phased renovation budgeting.',
  },
  {
    customerName: 'Darrell Steward',
    phone: '9840456789',
    email: 'darrell.steward@example.com',
    requirementText: 'Needs architectural advisory for a traditional Chettinad-style bungalow.',
    propertyType: 'Bungalow',
    preferredLocation: 'Karaikudi',
    budgetMin: 20000000,
    budgetMax: 40000000,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    source: 'NAV_CONTACT',
    notes: 'Asked for material and facade references.',
  },
];

const mockListingRequests = [
  {
    customerName: 'Leslie Alexander',
    phone: '9710112233',
    email: 'leslie.alex@example.com',
    requirementText: 'Wants to list a luxury 3BHK apartment in Sholinganallur.',
    propertyType: 'Apartment',
    preferredLocation: 'Sholinganallur',
    budgetMin: 8500000,
    budgetMax: 9500000,
    status: 'NEW',
    priority: 'HIGH',
    source: 'NAV_LISTING_REQUEST',
    notes: 'Seller ready with photos and legal papers.',
  },
  {
    customerName: 'Guy Hawkins',
    phone: '9710223344',
    email: 'guy.h@example.com',
    requirementText: 'Requested to list a 2400 sqft residential plot near GST Road.',
    propertyType: 'Plot',
    preferredLocation: 'Urapakkam',
    budgetMin: 4500000,
    budgetMax: 5500000,
    status: 'CONTACTED',
    priority: 'MEDIUM',
    source: 'NAV_LISTING_REQUEST',
    notes: 'Awaiting exact survey number.',
  },
  {
    customerName: 'Cody Fisher',
    phone: '9710334455',
    email: 'cody.f@example.com',
    requirementText: 'Listing a villa in Perungudi with private pool and home theatre.',
    propertyType: 'Villa',
    preferredLocation: 'Perungudi',
    budgetMin: 32000000,
    budgetMax: 35000000,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    source: 'NAV_LISTING_REQUEST',
    notes: 'Needs a valuation before going live.',
  },
];

async function seedMockData() {
  console.log('Seeding mock properties, leads, contacts, and listing requests...');

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`TRUNCATE TABLE ${properties}, ${leads}, ${contacts}, ${listingRequests} RESTART IDENTITY CASCADE`);

      const insertedProperties = await tx.insert(properties).values(mockProperties).returning();
      console.log(`Properties: inserted ${insertedProperties.length}`);

      const insertedLeads = await tx.insert(leads).values(mockLeads).returning();
      console.log(`Leads: inserted ${insertedLeads.length}`);

      const insertedContacts = await tx.insert(contacts).values(mockContacts).returning();
      console.log(`Contacts: inserted ${insertedContacts.length}`);

      const insertedListingRequests = await tx.insert(listingRequests).values(mockListingRequests).returning();
      console.log(`Listing requests: inserted ${insertedListingRequests.length}`);
    });

    console.log('Mock data seeded successfully.');
  } catch (error) {
    console.error('Mock data seed failed:', error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

seedMockData();
