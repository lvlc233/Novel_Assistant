export class AppError extends Error {
  code: number | string;
  data?: unknown;
  isSystemError: boolean;

  constructor(message: string, code: number | string = 500, data?: unknown, isSystemError = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.data = data;
    this.isSystemError = isSystemError;
  }

  static fromError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    if (error instanceof Error) {
      return new AppError(error.message);
    }
    return new AppError("Unknown error occurred");
  }
}

export const ErrorCodes = {
  SUCCESS: 200,
  SYSTEM_ERROR: 50000,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
};
