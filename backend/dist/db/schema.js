import { pgTable, uuid, varchar, text, doublePrecision, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
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
    price: doublePrecision('price').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    locality: varchar('locality', { length: 100 }).notNull(),
    bedrooms: integer('bedrooms').notNull(),
    bathrooms: integer('bathrooms').notNull(),
    areaSqft: doublePrecision('area_sqft').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    image: text('image').notNull(),
    tags: text('tags').array(), // PostgreSQL supports text arrays
    featured: boolean('featured').default(false).notNull(),
    verified: boolean('verified').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const leads = pgTable('leads', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    requirement: text('requirement').notNull(),
    status: varchar('status', { length: 20 }).default('NEW').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map