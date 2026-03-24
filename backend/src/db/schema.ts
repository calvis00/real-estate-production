import { pgTable, uuid, varchar, text, doublePrecision, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20 }).default('USER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  price: doublePrecision('price').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  locality: varchar('locality', { length: 100 }).notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  areaSqft: doublePrecision('area_sqft').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  image: text('image').notNull(),
  tags: text('tags').array(),
  featured: boolean('featured').default(false).notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  requirementText: text('requirement_text').notNull(),
  propertyType: varchar('property_type', { length: 50 }),
  preferredLocation: varchar('preferred_location', { length: 100 }),
  budgetMin: doublePrecision('budget_min'),
  budgetMax: doublePrecision('budget_max'),
  status: varchar('status', { length: 20 }).default('NEW').notNull(),
  priority: varchar('priority', { length: 20 }).default('MEDIUM').notNull(),
  source: varchar('source', { length: 50 }).default('website').notNull(),
  assignedTo: uuid('assigned_to'),
  nextFollowUpDate: timestamp('next_follow_up_date'),
  lastContactedAt: timestamp('last_contacted_at'),
  notes: text('notes'),
  tags: text('tags').array(),
  isConverted: boolean('is_converted').default(false).notNull(),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
