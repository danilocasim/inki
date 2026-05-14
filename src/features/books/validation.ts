import { z } from "zod";

import type { CreateBookInput } from "./types";

const optionalText = z.string().trim().min(1).optional();

export const createBookSchema = z.object({
  author: z.string().trim().min(1, "Author is required"),
  coverPath: optionalText,
  genre: optionalText,
  isbn: optionalText,
  source: optionalText,
  status: z.enum(["reading", "recent", "want-to-read", "finished", "not-yet"]),
  title: z.string().trim().min(1, "Title is required"),
  totalPages: z.number().int().min(0).optional()
}) satisfies z.ZodType<CreateBookInput>;

export const parseCreateBookInput = (input: unknown): CreateBookInput =>
  createBookSchema.parse(input);
