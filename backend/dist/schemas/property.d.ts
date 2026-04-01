import { z } from 'zod';
export declare const CreatePropertySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodCoercedNumber<unknown>;
    city: z.ZodString;
    locality: z.ZodString;
    bedrooms: z.ZodCoercedNumber<unknown>;
    bathrooms: z.ZodCoercedNumber<unknown>;
    areaSqft: z.ZodCoercedNumber<unknown>;
    type: z.ZodEnum<{
        RESIDENTIAL_BUY: "RESIDENTIAL_BUY";
        RESIDENTIAL_RENT: "RESIDENTIAL_RENT";
        PLOT: "PLOT";
        COMMERCIAL: "COMMERCIAL";
    }>;
    category: z.ZodEnum<{
        PLOT: "PLOT";
        APARTMENT: "APARTMENT";
        VILLA: "VILLA";
        INDEPENDENT_HOUSE: "INDEPENDENT_HOUSE";
        LAND: "LAND";
        OFFICE: "OFFICE";
    }>;
    tags: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodArray<z.ZodString>>;
    featured: z.ZodDefault<z.ZodPipe<z.ZodTransform<boolean, unknown>, z.ZodBoolean>>;
    verified: z.ZodDefault<z.ZodPipe<z.ZodTransform<boolean, unknown>, z.ZodBoolean>>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        HIDDEN: "HIDDEN";
        ARCHIVED: "ARCHIVED";
        SOLD: "SOLD";
        DRAFT: "DRAFT";
    }>>;
}, z.core.$strip>;
export declare const UpdatePropertySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    city: z.ZodOptional<z.ZodString>;
    locality: z.ZodOptional<z.ZodString>;
    bedrooms: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    bathrooms: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    areaSqft: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    type: z.ZodOptional<z.ZodEnum<{
        RESIDENTIAL_BUY: "RESIDENTIAL_BUY";
        RESIDENTIAL_RENT: "RESIDENTIAL_RENT";
        PLOT: "PLOT";
        COMMERCIAL: "COMMERCIAL";
    }>>;
    category: z.ZodOptional<z.ZodEnum<{
        PLOT: "PLOT";
        APARTMENT: "APARTMENT";
        VILLA: "VILLA";
        INDEPENDENT_HOUSE: "INDEPENDENT_HOUSE";
        LAND: "LAND";
        OFFICE: "OFFICE";
    }>>;
    tags: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodArray<z.ZodString>>>;
    featured: z.ZodOptional<z.ZodDefault<z.ZodPipe<z.ZodTransform<boolean, unknown>, z.ZodBoolean>>>;
    verified: z.ZodOptional<z.ZodDefault<z.ZodPipe<z.ZodTransform<boolean, unknown>, z.ZodBoolean>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        HIDDEN: "HIDDEN";
        ARCHIVED: "ARCHIVED";
        SOLD: "SOLD";
        DRAFT: "DRAFT";
    }>>>;
}, z.core.$strip>;
//# sourceMappingURL=property.d.ts.map