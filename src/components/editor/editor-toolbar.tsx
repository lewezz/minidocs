"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import type { ReactNode } from "react";

export function EditorToolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({ editor, selector: ({ editor }) => ({
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    paragraph: editor.isActive("paragraph"),
    h1: editor.isActive("heading", { level: 1 }),
    h2: editor.isActive("heading", { level: 2 }),
    h3: editor.isActive("heading", { level: 3 }),
    bulletList: editor.isActive("bulletList"),
    orderedList: editor.isActive("orderedList"),
  }) });

  function control(label: string, pressed: boolean, command: () => void, content: ReactNode) {
    return <button type="button" className="format-button" aria-label={label} aria-pressed={pressed} title={label}
      onMouseDown={(event) => event.preventDefault()} onClick={command}>{content}</button>;
  }

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Document formatting">
      <div className="toolbar-group">
        {control("Bold", active.bold, () => editor.chain().focus().toggleBold().run(), <strong>B</strong>)}
        {control("Italic", active.italic, () => editor.chain().focus().toggleItalic().run(), <em>I</em>)}
        {control("Underline", active.underline, () => editor.chain().focus().toggleUnderline().run(), <span className="format-underline">U</span>)}
      </div>
      <div className="toolbar-group">
        {control("Normal text", active.paragraph && !active.bulletList && !active.orderedList, () => editor.chain().focus().setParagraph().run(), "Text")}
        {control("Heading 1", active.h1, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1")}
        {control("Heading 2", active.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
        {control("Heading 3", active.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3")}
      </div>
      <div className="toolbar-group">
        {control("Bulleted list", active.bulletList, () => editor.chain().focus().toggleBulletList().run(), "Bulleted List")}
        {control("Numbered list", active.orderedList, () => editor.chain().focus().toggleOrderedList().run(), "Numbered List")}
      </div>
    </div>
  );
}
