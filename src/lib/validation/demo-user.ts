import { findDemoUser } from "@/lib/demo-users";
import { AppError } from "@/lib/errors";

export function requireDemoUser(handle: unknown) {
  const user = findDemoUser(handle);
  if (!user) throw new AppError("VALIDATION", "Select Alice or Bob as the demo user.");
  return user;
}
