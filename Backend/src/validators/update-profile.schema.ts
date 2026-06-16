import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name cannot be empty").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
  avatarUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional().nullable(),
  githubUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional().nullable(),
  linkedinUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional().nullable(),
});
