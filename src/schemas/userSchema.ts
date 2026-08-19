import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';
import { AUTOMATION_STATUS } from './automationSchema';

export const UserZodSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.string().min(2, 'Cargo é obrigatório'),
  linkedin: z.string().url('URL do LinkedIn inválida'),
  automationStatus: z.enum(AUTOMATION_STATUS).default('PENDING'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserType = z.infer<typeof UserZodSchema>;
export type UserDocument = UserType & Document;

export const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    linkedin: { type: String, required: true },
    automationStatus: {
      type: String,
      enum: AUTOMATION_STATUS,
      default: 'PENDING',
      required: true,
    },
  },
  { timestamps: true },
);

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
