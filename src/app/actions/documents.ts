"use server";

import { revalidatePath } from "next/cache";

import { runAction } from "@/server/action-result";
import { getActiveDemoUser } from "@/server/demo-session";
import { getDocumentService } from "@/server/documents";
import { AppError } from "@/lib/errors";

export async function importTxtAction(input: unknown) {
  return runAction(async () => {
    const actor = await getActiveDemoUser();
    if (!(input instanceof FormData)) throw new AppError("VALIDATION", "Select a text file to import.");
    const document = await getDocumentService().importTxt(actor.handle, input.get("file"));
    revalidatePath("/");
    return { id: document.id };
  });
}

export async function shareDocumentAction(id: unknown) {
  return runAction(async () => {
    const actor = await getActiveDemoUser();
    const result = await getDocumentService().share(actor.handle, id);
    revalidatePath("/");
    revalidatePath(`/documents/${result.id}`);
    return result;
  });
}

export async function createDocumentAction() {
  return runAction(async () => {
    const actor = await getActiveDemoUser();
    const document = await getDocumentService().create(actor.handle);
    revalidatePath("/");
    return { id: document.id };
  });
}

export async function saveDocumentAction(input: unknown) {
  return runAction(async () => {
    const actor = await getActiveDemoUser();
    const result = await getDocumentService().save(actor.handle, input);
    revalidatePath("/");
    revalidatePath(`/documents/${result.id}`);
    return result;
  });
}
