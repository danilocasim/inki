export type BookShareTemplateId = "quote" | "cover-left" | "cover-center" | "story-quote";

export interface BookShareTemplateOption {
  id: BookShareTemplateId;
  label: string;
  description: string;
}

export const BOOK_SHARE_TEMPLATES: readonly BookShareTemplateOption[] = [
  { id: "story-quote", label: "Editorial story", description: "photo · cover · quote" },
  { id: "quote", label: "Quote", description: "no cover · attribution shown" },
  { id: "cover-left", label: "Cover left", description: "large cover, quote below" },
  { id: "cover-center", label: "Cover center", description: "centered cover, quote below" },
];
