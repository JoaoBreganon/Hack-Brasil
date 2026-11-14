import { describe, expect, it } from "vitest";
import { PDF_PACKAGE } from "./index";

describe("@aloca/pdf", () => {
  it("exports the package name", () => {
    expect(PDF_PACKAGE).toBe("@aloca/pdf");
  });
});
