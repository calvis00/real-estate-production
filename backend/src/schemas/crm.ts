import { z } from 'zod';

const optionalString = z.string().trim().min(1).optional();
const optionalNullableString = z.string().trim().min(1).nullable().optional();
const optionalNullableDate = z.coerce.date().nullable().optional();
const optionalNumber = z.coerce.number().finite().optional();
const optionalBoolean = z.coerce.boolean().optional();

export const CrmStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'IN_PROGRESS',
  'NEED_TO_RECALL',
  'CLOSED',
]);

export const CrmPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const BaseCrmSchema = z.object({
  customerName: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255).optional(),
  requirementText: z.string().trim().min(3).max(5000),
  propertyType: optionalString,
  preferredLocation: optionalString,
  budgetMin: optionalNumber.nullable(),
  budgetMax: optionalNumber.nullable(),
  status: CrmStatusSchema.optional(),
  priority: CrmPrioritySchema.optional(),
  source: z.string().trim().min(1).max(50).optional(),
  assignedTo: optionalNullableString,
  nextFollowUpDate: optionalNullableDate,
  lastContactedAt: optionalNullableDate,
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).optional(),
  isConverted: optionalBoolean,
  convertedAt: optionalNullableDate,
});

export const CreateLeadSchema = BaseCrmSchema;
export const UpdateLeadSchema = BaseCrmSchema.partial();

export const CreateContactSchema = BaseCrmSchema;
export const UpdateContactSchema = BaseCrmSchema.partial();

export const CreateListingRequestSchema = BaseCrmSchema;
export const UpdateListingRequestSchema = BaseCrmSchema.partial();
