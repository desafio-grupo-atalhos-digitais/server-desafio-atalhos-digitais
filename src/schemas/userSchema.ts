import mongoose, { Document } from 'mongoose';
import { z } from 'zod';
import zodSchema from 'zod-mongoose';
import { AUTOMATION_STATUS } from './automationSchema';

export const UserZodSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.email('E-mail inválido'),
  role: z.string().min(2, 'Cargo é obrigatório'),
  linkedin: z.url('URL do LinkedIn inválida'),
  automationStatus: z.enum(AUTOMATION_STATUS).default('PENDING'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserType = z.infer<typeof UserZodSchema>;
export type UserDocument = UserType & Document;

const mongooseSchema = zodSchema(UserZodSchema);
export const UserModel = mongoose.model<UserDocument>('User', mongooseSchema);
