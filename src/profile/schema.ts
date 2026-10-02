import { z } from 'zod';
export const profileInputSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe como prefere ser chamado.').max(100, 'Use até 100 caracteres.'),
  locale: z.string().min(2).max(35).regex(/^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/, 'Informe um idioma válido.').refine((value) => { try { new Intl.Locale(value); return true; } catch { return false; } }, 'Idioma inválido.'),
  timezone: z.string().min(1, 'Informe seu fuso horário.').max(100).refine((value) => { try { new Intl.DateTimeFormat('pt-BR', { timeZone: value }); return true; } catch { return false; } }, 'Use um fuso válido, como America/Sao_Paulo.'),
}).strict();
export type ProfileInput = z.infer<typeof profileInputSchema>;
export const profileSchema = profileInputSchema.extend({ id: z.uuid(), createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }) });
export type Profile = z.infer<typeof profileSchema>;
export const meSchema = z.object({ identity: z.object({ authUserId: z.uuid() }).strict(), profile: profileSchema.nullable() }).strict();
export type Me = z.infer<typeof meSchema>;
