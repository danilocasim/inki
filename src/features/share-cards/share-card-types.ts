export const shareCardTypes = ["passport", "shelf-wall", "wrapped"] as const;

export type ShareCardType = (typeof shareCardTypes)[number];

export const isShareCardType = (value: string | undefined): value is ShareCardType =>
  value === "passport" || value === "shelf-wall" || value === "wrapped";
