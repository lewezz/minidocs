import "server-only";

import { cookies } from "next/headers";

import { requireDemoUser } from "@/lib/validation/demo-user";

export const DEMO_COOKIE = "minidocs-demo-user";

export async function getActiveDemoUser() {
  const handle = (await cookies()).get(DEMO_COOKIE)?.value ?? "alice";
  return requireDemoUser(handle);
}
