import mongoose, { Document } from 'mongoose';
import { z } from 'zod';
import zodSchema from 'zod-mongoose';

export const AUTOMATION_STATUS = [
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
] as const;

export type AutomationStatus = (typeof AUTOMATION_STATUS)[number];

export const AutomationZodSchema = z.object({
  candidateId: z.string(),
  status: z.enum(AUTOMATION_STATUS).default('PENDING'),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(3).optional(),
  lastError: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AutomationType = z.infer<typeof AutomationZodSchema>
export type AutomationDocument = AutomationType & Document;

const mongooseSchema = zodSchema(AutomationZodSchema);
export const AutomationModel = mongoose.model<AutomationDocument>(
  'Automation',
  mongooseSchema,
);
