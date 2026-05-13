import { z } from "zod";

import type { CreateBookmarkInput, CreateBookNoteInput, CreateQuoteInput } from "./types";

const optionalText = z.string().trim().min(1).optional();
const pageSchema = z.number().int().min(0);

export const createBookmarkSchema = z.object({
  bookId: z.string().trim().min(1, "Book is required"),
  label: optionalText,
  note: optionalText,
  page: pageSchema
}) satisfies z.ZodType<CreateBookmarkInput>;

export const createBookNoteSchema = z.object({
  body: z.string().trim().min(1, "Note is required"),
  bookId: z.string().trim().min(1, "Book is required"),
  page: pageSchema.optional(),
  title: optionalText
}) satisfies z.ZodType<CreateBookNoteInput>;

export const createQuoteSchema = z.object({
  bookId: z.string().trim().min(1, "Book is required"),
  captureMethod: z.enum(["manual", "ocr"]).optional(),
  page: pageSchema.optional(),
  sourceImagePath: optionalText,
  text: z.string().trim().min(1, "Quote text is required")
}) satisfies z.ZodType<CreateQuoteInput>;

export const parseCreateBookmarkInput = (input: unknown): CreateBookmarkInput =>
  createBookmarkSchema.parse(input);

export const parseCreateBookNoteInput = (input: unknown): CreateBookNoteInput =>
  createBookNoteSchema.parse(input);

export const parseCreateQuoteInput = (input: unknown): CreateQuoteInput =>
  createQuoteSchema.parse(input);
