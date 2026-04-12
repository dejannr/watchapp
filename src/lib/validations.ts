import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Unesite ispravnu e-poštu'),
    password: z.string().min(8, 'Lozinka mora imati najmanje 8 karaktera'),
    confirmPassword: z.string().min(8, 'Potvrda lozinke mora imati najmanje 8 karaktera'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne poklapaju',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Unesite ispravnu e-poštu'),
  password: z.string().min(1, 'Lozinka je obavezna'),
});

export const sellerApplySchema = z.object({
  sellerType: z.enum(['PRIVATE', 'BUSINESS']).optional(),
  displayName: z.string().min(2),
  slug: z.string().min(2),
  businessName: z.string().optional(),
  bio: z.string().min(20, 'Biografija mora imati najmanje 20 karaktera'),
  locationCity: z.string().trim().min(1, 'Grad je obavezan'),
  locationCountry: z.string().trim().min(1, 'Država je obavezna'),
  contactEmail: z.string().trim().email('Unesite ispravnu e-poštu'),
  contactPhone: z.string().trim().min(1, 'Kontakt telefon je obavezan'),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  instagramHandle: z.string().optional(),
});

export const inquirySchema = z.object({
  message: z.string().min(20).max(2000),
});

export const listingSchema = z.object({
  title: z.string().min(10).max(120),
  description: z.string().min(30),
  brandId: z.string().min(1),
  priceAmount: z.coerce.number().int().positive(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'FAIR']),
  referenceNumber: z.string().optional(),
  yearOfProduction: z.coerce.number().int().min(1900).max(2100).optional(),
  movementType: z.enum(['AUTOMATIC', 'MANUAL', 'QUARTZ', 'SMART', 'OTHER']).optional(),
  caseMaterial: z.string().optional(),
  braceletMaterial: z.string().optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().optional(),
  hasBox: z.boolean().optional(),
  hasPapers: z.boolean().optional(),
  inquiryEnabled: z.boolean().optional(),
});
