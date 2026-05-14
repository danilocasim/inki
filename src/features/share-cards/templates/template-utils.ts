export const cleanQuoteText = (quote: string): string => quote.trim().replace(/^"|"$/g, "");

export const scaled = (obj: Record<string, number>, scale: number): Record<string, number> => {
  const next: Record<string, number> = {};

  for (const [key, value] of Object.entries(obj)) {
    next[key] = value * scale;
  }

  return next;
};
