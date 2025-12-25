/**
 * Input Validation & Sanitization Utilities
 * Prevents injection attacks and data corruption
 */

import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Email inválido' })
  .max(255, { message: 'Email deve ter menos de 255 caracteres' })
  .transform((email) => email.toLowerCase());

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, { message: 'Palavra-passe deve ter pelo menos 8 caracteres' })
  .max(72, { message: 'Palavra-passe deve ter menos de 72 caracteres' })
  .regex(/[a-z]/, { message: 'Palavra-passe deve conter pelo menos uma letra minúscula' })
  .regex(/[A-Z]/, { message: 'Palavra-passe deve conter pelo menos uma letra maiúscula' })
  .regex(/[0-9]/, { message: 'Palavra-passe deve conter pelo menos um número' });

// Simple password schema (for existing users)
export const simplePasswordSchema = z
  .string()
  .min(6, { message: 'Palavra-passe deve ter pelo menos 6 caracteres' })
  .max(72, { message: 'Palavra-passe deve ter menos de 72 caracteres' });

// Name validation schema
export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  .max(100, { message: 'Nome deve ter menos de 100 caracteres' })
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nome contém caracteres inválidos' });

// Phone validation schema (Portuguese format)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+351)?[0-9]{9}$/, { message: 'Número de telefone inválido' })
  .optional()
  .or(z.literal(''));

// NIF validation schema (Portuguese tax number)
export const nifSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{9}$/, { message: 'NIF inválido (deve ter 9 dígitos)' })
  .optional()
  .or(z.literal(''));

// IBAN validation schema
export const ibanSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}[0-9]{23}$/, { message: 'IBAN inválido' })
  .optional()
  .or(z.literal(''));

// Safe text input schema (prevents XSS)
export const safeTextSchema = z
  .string()
  .trim()
  .max(1000, { message: 'Texto deve ter menos de 1000 caracteres' })
  .transform((text) => sanitizeHtml(text));

// URL validation schema
export const urlSchema = z
  .string()
  .trim()
  .url({ message: 'URL inválida' })
  .max(2048, { message: 'URL deve ter menos de 2048 caracteres' })
  .optional()
  .or(z.literal(''));

// UUID validation schema
export const uuidSchema = z
  .string()
  .uuid({ message: 'ID inválido' });

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize input for URL parameters
 */
export function sanitizeUrlParam(input: string): string {
  if (!input) return '';
  return encodeURIComponent(input.trim());
}

/**
 * Validate and sanitize login credentials
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

/**
 * Validate and sanitize registration data
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As palavras-passe não coincidem',
  path: ['confirmPassword'],
});

/**
 * Validate student registration data
 */
export const studentRegisterSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: simplePasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As palavras-passe não coincidem',
  path: ['confirmPassword'],
});

/**
 * Parse and validate data with error handling
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' };
    }
    return { success: false, error: 'Erro de validação' };
  }
}

/**
 * Safe parse without throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
