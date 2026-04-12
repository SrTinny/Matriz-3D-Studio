import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const activateSchema = z.object({
  token: z.string().trim().min(32),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(40),
  zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/),
  state: z.string().trim().min(2).max(2),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().min(2).max(80),
  street: z.string().trim().min(2).max(120),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(80).optional().or(z.literal('')),
});
