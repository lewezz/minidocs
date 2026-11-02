// Public demo identities; these IDs are not credentials. Keep in sync with the seed.
export const DEMO_USERS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    handle: "alice",
    name: "Alice",
    initials: "A",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    handle: "bob",
    name: "Bob",
    initials: "B",
  },
] as const;

export type DemoUser = (typeof DEMO_USERS)[number];
export type DemoHandle = DemoUser["handle"];

export function findDemoUser(handle: unknown): DemoUser | undefined {
  return DEMO_USERS.find((user) => user.handle === handle);
}
