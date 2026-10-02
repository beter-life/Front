import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'));
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
});
export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
  confirmPassword: z.string(),
}).refine(({ password, confirmPassword }) => password === confirmPassword, {
  path: ['confirmPassword'], message: 'As senhas precisam ser iguais.',
});
export const recoveryRequestSchema = z.object({ email: emailSchema });
export const newPasswordSchema = z.object({
  password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
  confirmPassword: z.string(),
}).refine(({ password, confirmPassword }) => password === confirmPassword, {
  path: ['confirmPassword'], message: 'As senhas precisam ser iguais.',
});

export type LoginInput = z.input<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;
export type RecoveryRequestInput = z.input<typeof recoveryRequestSchema>;
export type NewPasswordInput = z.input<typeof newPasswordSchema>;
