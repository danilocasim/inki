export type BookShareTemplateId = "story-quote" | "story-quote-right" | "quote";

export interface BookShareTemplateOption {
  id: BookShareTemplateId;
  label: string;
  description: string;
}

export const BOOK_SHARE_TEMPLATES: readonly BookShareTemplateOption[] = [
  {
    id: "story-quote",
    label: "Editorial · left",
    description: "cover left · stacked quote",
  },
  {
    id: "story-quote-right",
    label: "Editorial · right",
    description: "cover right · stacked quote",
  },
  {
    id: "quote",
    label: "Stacked quote",
    description: "no cover · title & author",
  },
];
