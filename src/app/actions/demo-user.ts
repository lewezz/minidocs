"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { requireDemoUser } from "@/lib/validation/demo-user";
import { runAction } from "@/server/action-result";
import { DEMO_COOKIE } from "@/server/demo-session";

export async function setDemoUserAction(handle: unknown) {
  return runAction(async () => {
    const user = requireDemoUser(handle);
    (await cookies()).set(DEMO_COOKIE, user.handle, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath("/", "layout");
    return { handle: user.handle };
  });
}
