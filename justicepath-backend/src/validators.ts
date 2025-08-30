// src/utils/validators.ts
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^]).{8,}$/,
    "Password must be 8+ chars and include upper, lower, number, and special char."
  ),
  // We will ignore client-provided role for security; keep here if you want to validate & gate it.
  role: z.enum(["USER","LAWYER","BAIL_BONDS","PROCESS_SERVER","APARTMENT_MANAGER","ADMIN"]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
