import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

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
  maxAttempts: z.number().int().positive().default(3),
  lastError: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AutomationType = z.infer<typeof AutomationZodSchema>;
export type AutomationDocument = AutomationType & Document;

export const AutomationSchema = new Schema<AutomationDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: AUTOMATION_STATUS,
      default: 'PENDING',
      required: true,
    },
    attempts: { type: Number, default: 0, required: true },
    maxAttempts: { type: Number, default: 3, required: true },
    lastError: { type: String, default: null },
    payload: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true },
);

export const AutomationModel =
  mongoose.models.Automation ||
  mongoose.model<AutomationDocument>('Automation', AutomationSchema);
