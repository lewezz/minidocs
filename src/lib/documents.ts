export const DEFAULT_TITLE = "Untitled document";
export const MAX_TITLE_LENGTH = 160;
export const MAX_CONTENT_BYTES = 512 * 1024;
export const MAX_TXT_BYTES = 256 * 1024;

export type DocumentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | null>;
  marks?: { type: string }[];
  content?: DocumentNode[];
};

export type DocumentContent = { type: "doc"; content: DocumentNode[] };

export function emptyDocument(): DocumentContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export type DocumentSummary = {
  id: string;
  ownerId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = DocumentSummary & { content: DocumentContent };
export type DocumentLists = { owned: DocumentSummary[]; shared: DocumentSummary[] };
