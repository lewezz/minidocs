import { getSchema } from "@tiptap/core";

import { MAX_CONTENT_BYTES, MAX_TITLE_LENGTH, type DocumentContent } from "@/lib/documents";
import { documentExtensions } from "@/lib/editor/extensions";
import { AppError } from "@/lib/errors";

const schema = getSchema(documentExtensions());
const nodeNames = new Set(["doc", "paragraph", "text", "heading", "bulletList", "orderedList", "listItem", "hardBreak"]);
const markNames = new Set(["bold", "italic", "underline"]);

function invalidContent(): never {
  throw new AppError("VALIDATION", "The content is invalid or contains unsupported formatting.");
}

export function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("VALIDATION", "The request data is invalid.");
  }
  const prototype: unknown = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) invalidContent();
  return input as Record<string, unknown>;
}

export function onlyKeys(input: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new AppError("VALIDATION", "The request contains unsupported fields.");
  }
}

export function validateDocumentId(input: unknown): string {
  if (typeof input !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)) {
    throw new AppError("VALIDATION", "The document ID is invalid.");
  }
  return input.toLowerCase();
}

export function validateTitle(input: unknown): string {
  if (typeof input !== "string") throw new AppError("VALIDATION", "The title must be text.");
  const title = input.trim();
  if (!title) throw new AppError("VALIDATION", "Enter a document title.");
  if (Array.from(title).length > MAX_TITLE_LENGTH) {
    throw new AppError("VALIDATION", `The title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }
  if (/[\u0000-\u001f\u007f-\u009f]/.test(title)) {
    throw new AppError("VALIDATION", "The title cannot contain control characters or line breaks.");
  }
  return title;
}

export function validateDocumentContent(input: unknown): DocumentContent {
  let count = 0;
  function walk(value: unknown, depth: number) {
    if (depth > 32 || ++count > 5000) invalidContent();
    const node = objectInput(value);
    if (typeof node.type !== "string" || !nodeNames.has(node.type)) invalidContent();
    const allowedKeys = node.type === "text" ? ["type", "text", "marks"]
      : node.type === "hardBreak" ? ["type", "marks"]
      : ["heading", "orderedList"].includes(node.type) ? ["type", "content", "attrs"]
      : ["type", "content"];
    onlyKeys(node, allowedKeys);
    if (node.text !== undefined && (node.type !== "text" || typeof node.text !== "string" || node.text.includes("\u0000"))) invalidContent();
    if (node.attrs !== undefined) {
      const attrs = objectInput(node.attrs);
      const allowed = Object.keys(schema.nodes[node.type]?.spec.attrs ?? {});
      onlyKeys(attrs, allowed);
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "level" && (!Number.isInteger(value) || ![1, 2, 3].includes(value as number))) invalidContent();
        else if (key === "start" && (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 1_000_000)) invalidContent();
        else if (key === "type" && value !== null && !["1", "a", "A", "i", "I"].includes(value as string)) invalidContent();
        else if (!["level", "start", "type"].includes(key)) invalidContent();
      }
    }
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks) || node.marks.length > 3) invalidContent();
      for (const value of node.marks) {
        const mark = objectInput(value);
        onlyKeys(mark, ["type"]);
        if (typeof mark.type !== "string" || !markNames.has(mark.type)) invalidContent();
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) invalidContent();
      for (const child of node.content) walk(child, depth + 1);
    }
  }
  walk(input, 0);
  const root = objectInput(input);
  if (root.type !== "doc") invalidContent();

  const serialized = JSON.stringify(input);
  if (new TextEncoder().encode(serialized).byteLength > MAX_CONTENT_BYTES) {
    throw new AppError("VALIDATION", "The content exceeds the 512 KiB limit.");
  }
  try {
    const document = schema.nodeFromJSON(input);
    document.check();
    // ProseMirror attributes can have null prototypes, which React Server
    // Components cannot pass to the client. Return a plain JSON tree.
    return JSON.parse(JSON.stringify(document.toJSON())) as DocumentContent;
  } catch {
    return invalidContent();
  }
}

export function validateSaveInput(input: unknown) {
  const value = objectInput(input);
  onlyKeys(value, ["id", "title", "content"]);
  const base = { id: validateDocumentId(value.id), content: validateDocumentContent(value.content) };
  return Object.hasOwn(value, "title") ? { ...base, title: validateTitle(value.title) } : base;
}
