# Browser acceptance checklist

Status: this checklist is provided for the candidate. It has not been completed through browser interaction by the assistant. Real Supabase and HTTP results are recorded separately in `VERIFICATION.md`.

## Main workflow

1. Start with configured Supabase and open MiniDocs. Confirm the connection indicator and the explicit demo-identity notice.
2. Select **Alice**, then **New document**. Confirm an editor opens at `/documents/<uuid>`.
3. Change the title to `Alice and Bob acceptance`. Type several paragraphs. Apply **Bold**, **Italic**, **Underline**, **Heading 1**, **Heading 2**, **Heading 3**, **Bulleted List** and **Numbered List** using the toolbar. Exit a list with Enter twice as needed.
4. Confirm **Unsaved changes**, click **Save**, and observe **Saving…** then **Saved**. Reload and confirm the title, text and each format are preserved. Reopen from **My documents** as another persistence check.
5. Before sharing, copy the URL, return to documents, select **Bob** and open that URL. It must show the English not-found page. The document must not appear in either Bob list.
6. Return as Alice, open the document and click **Share with Bob**. The control should become **Shared with Bob**. Reload and confirm the grant still appears; another request must not create duplicate rows.
7. Return to documents, select Bob and find it under **Shared with me**. Open it. The title must be read-only and there must be no sharing control. Add `Edited by Bob`, save and reload.
8. Return as Alice and reopen it. Confirm Bob's saved text is visible and Alice can still rename the document. Save any title change.
9. As Alice, click **Import TXT** and choose `samples/demo.txt`. Confirm a new editable document opens with Unicode, blank lines and literal `<strong>` tags. Save an edit, reload and reopen it from My documents.
10. Try a non-TXT file, an empty TXT, an invalid UTF-8 TXT and a TXT larger than 256 KiB. Expect English errors and no imported document. The file chooser may hide unsupported extensions; server validation is independently covered by automated tests.

## Additional checks

- Keyboard: visible focus, associated title label, named formatting controls, selected formatting state and accessible save/error feedback.
- Narrow viewport: document actions and toolbar remain usable; the writing area scrolls without losing controls.
- Unsaved changes: try leaving the editor and reloading. Confirm the warning, cancel it and verify edits remain.
- Invalid title: remove all text from the title and click Save. Expect a validation error with edits retained. Maximum title length is 160 characters on the server.
- Server denials: recipient rename/reshare, tampered actor, invalid UUID and private reads/writes are covered by tests; UI restrictions alone are not the authorization mechanism.

Record the tested URL, browser, date, pass/fail and any corrections in `VERIFICATION.md`. Repeat the main workflow on the actual public deployment before claiming production acceptance.
