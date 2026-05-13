export type LocalErrorCode = "unknown" | "permission-denied" | "storage-unavailable";

/** App-local error type for user-recoverable offline-first failures. */
export class LocalError extends Error {
  readonly code: LocalErrorCode;

  constructor(code: LocalErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "LocalError";
  }
}
