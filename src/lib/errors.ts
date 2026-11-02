export type ErrorCode = "VALIDATION" | "NOT_FOUND" | "FORBIDDEN" | "CONFIGURATION" | "PERSISTENCE";

export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function publicError(error: unknown): { code: ErrorCode; message: string } {
  if (error instanceof AppError) return { code: error.code, message: error.message };
  return { code: "PERSISTENCE", message: "The operation could not be completed. Please try again." };
}
