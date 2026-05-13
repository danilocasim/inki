import { getIsbnFromBarcode, normalizeIsbnScan } from "../services/isbn-service";

describe("ISBN scan parsing", () => {
  it("accepts valid book EAN-13 barcodes", () => {
    expect(normalizeIsbnScan("9780571365432")).toBe("9780571365432");
    expect(getIsbnFromBarcode({ data: "978-0-571-36543-2", type: "ean13" })).toBe(
      "9780571365432"
    );
  });

  it("rejects non-book or invalid barcodes", () => {
    expect(normalizeIsbnScan("1234567890128")).toBeUndefined();
    expect(normalizeIsbnScan("9780571365430")).toBeUndefined();
    expect(getIsbnFromBarcode({ data: "9780571365432", type: "qr" })).toBeUndefined();
  });

  it("accepts valid ISBN-10 manual strings", () => {
    expect(normalizeIsbnScan("0-306-40615-2")).toBe("0306406152");
  });
});
