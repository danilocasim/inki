import { parseCreateBookInput } from "../validation";

describe("book validation", () => {
  it("accepts a valid local book draft", () => {
    expect(
      parseCreateBookInput({
        author: "Sally Rooney",
        status: "reading",
        title: "Normal People",
        totalPages: 273
      })
    ).toMatchObject({ title: "Normal People" });
  });

  it("rejects empty titles", () => {
    expect(() =>
      parseCreateBookInput({ author: "Sally Rooney", status: "reading", title: "" })
    ).toThrow();
  });
});
