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
}, z.core.$strip>;
//# sourceMappingURL=property.d.ts.map