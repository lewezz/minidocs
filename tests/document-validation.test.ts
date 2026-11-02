import { describe, expect, it } from "vitest";

import { emptyDocument, MAX_CONTENT_BYTES } from "@/lib/documents";
import { validateDocumentContent, validateDocumentId, validateSaveInput, validateTitle } from "@/lib/validation/documents";

describe("document inputs", () => {
  it.each([null, 12, "", "not-a-uuid", "x' OR 1=1", "00000000-0000-0000-0000-000000000000"])("rejects invalid document IDs: %j", (value) => {
    expect(() => validateDocumentId(value)).toThrow();
  });
  it("normalizes UUID case", () => {
    expect(validateDocumentId("AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA")).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
  it("trims titles and preserves UTF-8", () => {
    expect(validateTitle("  Café · 日本語  ")).toBe("Café · 日本語");
    expect(validateTitle("📝".repeat(160))).toHaveLength(320);
  });
  it.each([undefined, "", "   ", "a".repeat(161), "line\nbreak", "null\u0000byte"])("rejects invalid titles: %j", (value) => {
    expect(() => validateTitle(value)).toThrow();
  });
  it("rejects an injected owner field instead of silently accepting it", () => {
    expect(() => validateSaveInput({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", content: emptyDocument(), ownerId: "bob" })).toThrow("unsupported fields");
  });
});

describe("structured Tiptap JSON validation", () => {
  it("round trips all requested formats and literal HTML text", () => {
    const content = { type: "doc", content: [
      ...[1, 2, 3].map((level) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text: `H${level}` }] })),
      { type: "paragraph", content: [{ type: "text", text: "<script>alert('UTF-8: café 日本語')</script>", marks: [{ type: "bold" }, { type: "italic" }, { type: "underline" }] }, { type: "hardBreak" }, { type: "text", text: "Otra línea" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Viñeta" }] }] }] },
      { type: "orderedList", attrs: { start: 1, type: null }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Número" }] }] }] },
    ] };
    expect(validateDocumentContent(content)).toEqual(content);
  });
  it("accepts an empty paragraph", () => {
    expect(validateDocumentContent(emptyDocument())).toEqual(emptyDocument());
  });
  it("returns plain attribute objects suitable for React Server Components", () => {
    const result = validateDocumentContent({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
      { type: "orderedList", attrs: { start: 1, type: null }, content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
    ] });
    for (const node of result.content) expect(Object.getPrototypeOf(node.attrs)).toBe(Object.prototype);
  });
  it.each([
    "<p>HTML is not JSON</p>", null, [], {}, { type: "doc", content: [] },
    { type: "doc", content: [{ type: "text", text: "Text outside a paragraph" }] },
    { type: "doc", content: [{ type: "heading", attrs: { level: 4 } }] },
    { type: "doc", content: [{ type: "image", attrs: { src: "javascript:alert(1)" } }] },
    { type: "doc", content: [{ type: "paragraph", attrs: { onclick: "alert(1)" } }] },
    { type: "doc", content: [{ type: "bulletList", content: [{ type: "paragraph" }] }] },
    { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] },
    { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "bold", attrs: { onmouseover: "evil" } }] }] }] },
    { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "\u0000" }] }] },
    { type: "doc", content: [{ type: "orderedList", attrs: { start: -1 } }] },
  ])("rejects malformed, unsafe or unsupported content: %j", (input) => {
    expect(() => validateDocumentContent(input)).toThrow();
  });
  it("rejects own __proto__ attributes", () => {
    const payload: unknown = JSON.parse('{"type":"doc","content":[{"type":"heading","attrs":{"level":1,"__proto__":{"onerror":"evil"}}}]}');
    expect(() => validateDocumentContent(payload)).toThrow();
  });
  it("limits document bytes with UTF-8 accounting", () => {
    expect(() => validateDocumentContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "é".repeat(MAX_CONTENT_BYTES / 2) }] }] })).toThrow("512 KiB");
  });
  it("limits node count", () => {
    expect(() => validateDocumentContent({ type: "doc", content: Array.from({ length: 5001 }, () => ({ type: "paragraph" })) })).toThrow();
  });
  it("limits nesting and cyclic input before recursive serialization", () => {
    const paragraph = { type: "paragraph", content: [] as unknown[] };
    paragraph.content.push(paragraph);
    expect(() => validateDocumentContent({ type: "doc", content: [paragraph] })).toThrow();
  });
});
