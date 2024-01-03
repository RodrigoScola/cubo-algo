/* eslint-disable max-classes-per-file */
import { Response } from "express";

export enum HTTPCodes {
  OK = 200,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  METHOD_NOT_ALLOWED = 405,
  REFUSED = 418,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export abstract class ErrorHandler {
  private static isTrustedError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }

    return false;
  }

  private static handleTrustedError(error: AppError, response: Response): void {
    response.status(error.httpCode).json({
      name: error.name,
      message: error.message,
    });
  }

  private static handleCriticalError(e: Error | AppError, response?: Response): void {
    if (response) {
      response.status(HTTPCodes.INTERNAL_SERVER_ERROR).json({
        ...e,
        message: "Internal Server Error",
      });
    }
    console.log(`Application encountered critical error. Shutting off`);
    console.log(e);
  }

  static handle(error: Error, res?: Response): void {
    console.error(error);
    if (ErrorHandler.isTrustedError(error) && res) {
      ErrorHandler.handleTrustedError(error as AppError, res);
    } else {
      ErrorHandler.handleCriticalError(error, res);
    }
  }
}

type AppErrorArgs = {
  name?: string;
  httpCode: HTTPCodes;
  description: string;
  isOperational?: boolean;
};

export class AppError extends Error {
  public override readonly name: string;
  public readonly httpCode: HTTPCodes;
  public readonly isOperational: boolean = true;

  constructor(args: AppErrorArgs) {
    super(args.description);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = args.name || "Error";
    this.httpCode = args.httpCode;

    if (args.isOperational !== undefined) {
      this.isOperational = args.isOperational;
    }

    Error.captureStackTrace(this);
  }
}

export class BadRequestError {
  public readonly httpCode: HTTPCodes;
  public readonly isOperational: boolean = true;

  constructor(message: string) {
    throw new AppError({
      description: message,
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
}

export class NotFoundError {
  public readonly httpCode: HTTPCodes;
  public readonly isOperational: boolean = true;

  constructor(message: string) {
    throw new AppError({
      description: message,
      httpCode: HTTPCodes.NOT_FOUND,
    });
  }
}

export class InternalError {
  public readonly httpCode: HTTPCodes;
  public readonly isOperational: boolean = true;

  constructor(message: string = "Something Wrong Happened") {
    this.httpCode = HTTPCodes.INTERNAL_SERVER_ERROR;
    throw new AppError({
      description: message,
      httpCode: HTTPCodes.INTERNAL_SERVER_ERROR,
    });
  }
}

export class InvalidIdError {
  public readonly httpCode: HTTPCodes;
  public readonly isOperational: boolean = true;

  constructor(message: string = "Invalid Id") {
    this.httpCode = HTTPCodes.INTERNAL_SERVER_ERROR;

    throw new AppError({
      description: message,
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
}
