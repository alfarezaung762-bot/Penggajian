import * as z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, { error: 'Username wajib diisi' }),
  password: z.string().min(1, { error: 'Password wajib diisi' }),
})

export const createAccountSchema = z.object({
  name: z.string()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(255, { error: 'Nama maksimal 255 karakter' }),
  username: z.string()
    .min(3, { error: 'Username minimal 3 karakter' })
    .max(255, { error: 'Username maksimal 255 karakter' }),
  password: z.string()
    .min(6, { error: 'Password minimal 6 karakter' })
    .max(100, { error: 'Password maksimal 100 karakter' }),
  role: z.enum(['hrd', 'admin_owner'], {
    error: 'Role harus hrd atau admin_owner',
  }),
})

export const updateAccountSchema = z.object({
  name: z.string()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(255, { error: 'Nama maksimal 255 karakter' })
    .optional(),
  username: z.string()
    .min(3, { error: 'Username minimal 3 karakter' })
    .max(255, { error: 'Username maksimal 255 karakter' })
    .optional(),
  password: z.string()
    .min(6, { error: 'Password minimal 6 karakter' })
    .max(100, { error: 'Password maksimal 100 karakter' })
    .optional(),
  role: z.enum(['hrd', 'admin_owner'], {
    error: 'Role harus hrd atau admin_owner',
  }).optional(),
  is_active: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  password_lama: z.string().min(1, { error: 'Password lama wajib diisi' }),
  password_baru: z.string()
    .min(6, { error: 'Password baru minimal 6 karakter' })
    .max(100, { error: 'Password baru maksimal 100 karakter' }),
})

export const resetPasswordSchema = z.object({
  password_baru: z.string()
    .min(6, { error: 'Password baru minimal 6 karakter' })
    .max(100, { error: 'Password baru maksimal 100 karakter' }),
})
