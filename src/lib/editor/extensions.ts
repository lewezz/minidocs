import StarterKit from "@tiptap/starter-kit";

// Shared by the browser editor and server validation. No HTML or paid extensions.
export function documentExtensions() {
  return [StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
    strike: false,
    trailingNode: false,
  })];
}
