export const shareCardTypes = ["wrapped"] as const;

export type ShareCardType = (typeof shareCardTypes)[number];

export const isShareCardType = (value: string | undefined): value is ShareCardType =>
  value === "wrapped";
