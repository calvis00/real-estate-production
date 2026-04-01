import { z } from 'zod';

export const CreatePropertySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long'),
  description: z.string().min(50, 'Description must be detailed (at least 50 chars)'),
  price: z.coerce.number().positive('Price must be positive'),
  city: z.string().min(1),
  locality: z.string().min(1),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  areaSqft: z.coerce.number().positive(),
  type: z.enum(['RESIDENTIAL_BUY', 'RESIDENTIAL_RENT', 'PLOT', 'COMMERCIAL']),
  category: z.enum(['APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE', 'LAND', 'OFFICE', 'PLOT']),
  tags: z.preprocess((val) => (typeof val === 'string' ? val.split(',').map(t => t.trim()) : val), z.array(z.string())),
  featured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  verified: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  status: z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD', 'DRAFT']).default('ACTIVE'),
});

export const UpdatePropertySchema = CreatePropertySchema.partial();
