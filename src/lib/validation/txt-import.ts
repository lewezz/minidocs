import { MAX_TITLE_LENGTH, MAX_TXT_BYTES } from "@/lib/documents";
import { AppError } from "@/lib/errors";
import { validateDocumentContent, validateTitle } from "@/lib/validation/documents";

export async function parseTxtImport(input: unknown) {
  if (!(input instanceof File)) throw new AppError("VALIDATION", "Select a text file to import.");
  if (!/\.txt$/i.test(input.name)) throw new AppError("VALIDATION", "Only .txt files are supported.");
  if (input.size === 0) throw new AppError("VALIDATION", "The text file is empty.");
  if (input.size > MAX_TXT_BYTES) throw new AppError("VALIDATION", "The file exceeds the 256 KiB limit.");
  const bytes = await input.arrayBuffer();
  if (bytes.byteLength > MAX_TXT_BYTES) throw new AppError("VALIDATION", "The file exceeds the 256 KiB limit.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new AppError("VALIDATION", "The file must use valid UTF-8 encoding.");
  }
  if (!text.length) throw new AppError("VALIDATION", "The text file is empty.");
  if (text.includes("\u0000")) throw new AppError("VALIDATION", "The file contains unsupported binary characters.");
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 2000) throw new AppError("VALIDATION", "The file exceeds the 2,000-line document limit.");
  const title = validateTitle(Array.from(input.name.replace(/\.txt$/i, "").trim() || "Imported document").slice(0, MAX_TITLE_LENGTH).join(""));
  // Text nodes only: imported markup is never parsed as HTML.
  const content = validateDocumentContent({ type: "doc", content: lines.map((line) => ({
    type: "paragraph", ...(line ? { content: [{ type: "text", text: line }] } : {}),
  })) });
  return { title, content };
}
