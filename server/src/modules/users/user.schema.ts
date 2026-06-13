import { z } from 'zod';
import { Genre } from '@prisma/client';

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  experienceLevel: z.string().optional(),
  dailyWordCount: z.number().int().min(0).optional(),
  availability: z.string().optional(),
  writingGoals: z.array(z.string()).optional(),
  genres: z.array(z.nativeEnum(Genre)).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
