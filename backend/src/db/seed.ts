import { db } from './index.js';
import { leads, contacts, listingRequests } from './schema.js';

async function seed() {
  console.log('🌱 Seeding multi-table mock data...');

  try {
    // 1. GENERAL LEADS (Leads Table)
    const generalLeads = [
      {
        customerName: 'Jerome Bell',
        phone: '9600123987',
        email: 'jerome.b@example.com',
        requirementText: 'Walk-in enquiry for budget 2BHK near Tambaram station.',
        propertyType: 'Apartment',
        preferredLocation: 'Tambaram',
        budgetMin: 4000000,
        budgetMax: 5500000,
        source: 'WALK_IN',
        priority: 'MEDIUM'
      },
      {
        customerName: 'Theresa Webb',
        phone: '9600987123',
        email: 'theresa.w@example.com',
        requirementText: 'Phone enquiry: wants north-facing independent house in Anna Nagar.',
        propertyType: 'House',
        preferredLocation: 'Anna Nagar',
        budgetMin: 45000000,
        budgetMax: 60000000,
        source: 'PHONE',
        priority: 'HIGH'
      },
      {
        customerName: 'Albert Flores',
        phone: '9600456123',
        email: 'albert.f@example.com',
        requirementText: 'Looking for agricultural land within 50km of Chennai.',
        propertyType: 'Land',
        preferredLocation: 'Chengalpattu',
        budgetMin: 10000000,
        budgetMax: 20000000,
        source: 'REFERRAL',
        priority: 'LOW'
      },
      {
        customerName: 'Kathryn Murphy',
        phone: '9600789456',
        email: 'kathryn.m@example.com',
        requirementText: 'Investor looking for multiple plots in growing OMR regions.',
        propertyType: 'Plot',
        preferredLocation: 'Thiruporur',
        budgetMin: 50000000,
        budgetMax: 100000000,
        source: 'WALK_IN',
        priority: 'HIGH'
      }
    ];

    // 2. CONTACTS (Contacts Table)
    const contactEnquiries = [
      {
        customerName: 'Jane Cooper',
        phone: '9840123456',
        email: 'jane.cooper@example.com',
        requirementText: 'Interested in modern sustainable villa design for a 2400 sqft plot in ECR.',
        propertyType: 'Villa',
        preferredLocation: 'ECR, Chennai',
        budgetMin: 15000000,
        budgetMax: 25000000,
        source: 'NAV_CONTACT',
        priority: 'HIGH'
      },
      {
        customerName: 'Robert Fox',
        phone: '9840234567',
        email: 'robert.fox@example.com',
        requirementText: 'Looking for luxury renovation advisory for an old penthouse.',
        propertyType: 'Penthouse',
        preferredLocation: 'Adyar',
        budgetMin: 5000000,
        budgetMax: 10000000,
        source: 'NAV_CONTACT',
        priority: 'MEDIUM'
      },
      {
        customerName: 'Eleanor Pena',
        phone: '9840345678',
        email: 'eleanor.pena@example.com',
        requirementText: 'Needs floor plan design for a new commercial space.',
        propertyType: 'Commercial',
        preferredLocation: 'OMR',
        budgetMin: 8000000,
        budgetMax: 12000000,
        source: 'NAV_CONTACT',
        priority: 'LOW'
      },
      {
        customerName: 'Darrell Steward',
        phone: '9840456789',
        email: 'darrell.steward@example.com',
        requirementText: 'Inquiry regarding traditional Chettinad architecture for bungalow.',
        propertyType: 'Bungalow',
        preferredLocation: 'Karaikudi',
        budgetMin: 20000000,
        budgetMax: 40000000,
        source: 'NAV_CONTACT',
        priority: 'HIGH'
      }
    ];

    // 3. LISTING REQUESTS (Listing Requests Table)
    const listingEnquiries = [
      {
        customerName: 'Leslie Alexander',
        phone: '9710112233',
        email: 'leslie.alex@example.com',
        requirementText: 'Want to sell my 3BHK luxury apartment in Bollineni Hillside.',
        propertyType: 'Apartment',
        preferredLocation: 'Sholinganallur',
        budgetMin: 8500000,
        budgetMax: 9500000,
        source: 'NAV_LISTING_REQUEST',
        priority: 'HIGH'
      },
      {
        customerName: 'Guy Hawkins',
        phone: '9710223344',
        email: 'guy.h@example.com',
        requirementText: 'Requested to list 2400 sqft residential plot near GST Road.',
        propertyType: 'Plot',
        preferredLocation: 'Urapakkam',
        budgetMin: 4500000,
        budgetMax: 5500000,
        source: 'NAV_LISTING_REQUEST',
        priority: 'MEDIUM'
      },
      {
        customerName: 'Cody Fisher',
        phone: '9710334455',
        email: 'cody.f@example.com',
        requirementText: 'Listing a gated community villa in Perungudi with private pool.',
        propertyType: 'Villa',
        preferredLocation: 'Perungudi',
        budgetMin: 32000000,
        budgetMax: 35000000,
        source: 'NAV_LISTING_REQUEST',
        priority: 'HIGH'
      },
      {
        customerName: 'Bessie Cooper',
        phone: '9710445566',
        email: 'bessie.c@example.com',
        requirementText: 'Interested in listing commercial warehouse space in Madhavaram.',
        propertyType: 'Commercial',
        preferredLocation: 'Madhavaram',
        budgetMin: 12000000,
        budgetMax: 15000000,
        source: 'NAV_LISTING_REQUEST',
        priority: 'LOW'
      }
    ];

    const leadsResult = await db.insert(leads).values(generalLeads).returning();
    console.log(`✅ Leads: Inserted ${leadsResult.length} mock leads.`);

    const contactsResult = await db.insert(contacts).values(contactEnquiries).returning();
    console.log(`✅ Contacts: Inserted ${contactsResult.length} mock contacts.`);

    const listingResult = await db.insert(listingRequests).values(listingEnquiries).returning();
    console.log(`✅ Listings: Inserted ${listingResult.length} mock listing requests.`);

    console.log('✨ All tables seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

seed();
