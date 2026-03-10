import { z } from 'zod';

// ----- Reusable primitives -----

const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const phoneRegex = /^\d{7,15}$/;

// ----- Input schema (step 2 — email or phone) -----

export const inputSchema = z
    .object({
        method: z.enum(['phone', 'email']),
        identifier: z
            .string()
            .min(1, 'This field is required')
            .transform((val) => val.trim()),
    })
    .superRefine((data, ctx) => {
        const val = data.identifier.trim();

        if (data.method === 'email') {
            if (!emailRegex.test(val)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Please enter a valid email address',
                    path: ['identifier'],
                });
            }
        } else {
            // Strip any accidental spaces the user may have typed
            const digits = val.replace(/\s/g, '');

            if (digits.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Phone number is required',
                    path: ['identifier'],
                });
            } else if (/\D/.test(digits)) {
                // Contains non-digit characters (e.g. letters, +, -)
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Phone number must contain digits only (no spaces, dashes or +)',
                    path: ['identifier'],
                });
            } else if (!phoneRegex.test(digits)) {
                const tooShort = digits.length < 7;
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: tooShort
                        ? 'Phone number is too short (minimum 7 digits)'
                        : 'Phone number is too long (maximum 15 digits)',
                    path: ['identifier'],
                });
            }
        }
    });

// ----- Details schema (step 5 — profile) -----

// Only letters, spaces, hyphens and apostrophes — no numbers or symbols
const fullNameRegex = /^[a-zA-Z\u00C0-\u024F\s'\-]+$/;

export const detailsSchema = z.object({
    fullName: z
        .string()
        .min(1, 'Full name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .transform((val) => val.trim())
        .refine((val) => fullNameRegex.test(val), {
            message: 'Name can only contain letters, spaces, hyphens and apostrophes',
        }),

    location: z
        .string()
        .min(1, 'Please select a location'),

    bio: z
        .string()
        .max(100, 'Bio cannot exceed 100 characters')
        .nullable()
        .optional()
        .transform((val) => (val ? val.trim() : val)),
});

// ---- Exported types ----

export type InputFormData = z.infer<typeof inputSchema>;
export type DetailsFormData = z.infer<typeof detailsSchema>;