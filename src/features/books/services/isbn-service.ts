export interface BarcodeScanPayload {
  data: string;
  type: string;
}

/** Normalizes ISBN scans so camera and manual fallback paths share validation. */
export const normalizeIsbnScan = (value: string): string | undefined => {
  const compact = value.replace(/[^0-9Xx]/g, "").toUpperCase();

  if (compact.length === 13 && isValidIsbn13(compact)) {
    return compact;
  }

  if (compact.length === 10 && isValidIsbn10(compact)) {
    return compact;
  }

  return undefined;
};

export const getIsbnFromBarcode = (scan: BarcodeScanPayload): string | undefined => {
  const type = scan.type.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (type !== "ean13" && type !== "upca") {
    return undefined;
  }

  return normalizeIsbnScan(scan.data);
};

const isValidIsbn13 = (value: string): boolean => {
  if (!/^97[89][0-9]{10}$/.test(value)) {
    return false;
  }

  const digits = value.split("").map(Number);
  const sum = digits.slice(0, 12).reduce((total, digit, index) => {
    const weight = index % 2 === 0 ? 1 : 3;

    return total + digit * weight;
  }, 0);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[12];
};

const isValidIsbn10 = (value: string): boolean => {
  if (!/^[0-9]{9}[0-9X]$/.test(value)) {
    return false;
  }

  const sum = value.split("").reduce((total, character, index) => {
    const digit = character === "X" ? 10 : Number(character);

    return total + digit * (10 - index);
  }, 0);

  return sum % 11 === 0;
};
