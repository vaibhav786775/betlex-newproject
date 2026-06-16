import { z } from "zod";

export const createRegistrationSchema = z.object({
  registrationData: z.record(z.string(), z.any()).default({}),
  teamId: z.string().uuid().optional(),
});
