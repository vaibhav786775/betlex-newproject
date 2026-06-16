import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  slug: z.string().min(3),
  registrationOpen: z.string().datetime(),
  registrationClose: z.string().datetime(),
  eventStart: z.string().datetime(),
  eventEnd: z.string().datetime(),
  submissionDeadline: z.string().datetime(),
  timezone: z.string(),
  maxTeamSize: z.number().int().min(1),
  minTeamSize: z.number().int().min(1),
  maxRegistrations: z.number().int().nullable().optional(),
  tags: z.array(z.string()),
  prizePool: z.any(),
  isPublic: z.boolean().default(true),
});

export const updateEventSchema = createEventSchema.partial();
