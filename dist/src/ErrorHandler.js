"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorHandler = exports.HTTPCodes = void 0;
var HTTPCodes;
(function (HTTPCodes) {
    HTTPCodes[HTTPCodes["OK"] = 200] = "OK";
    HTTPCodes[HTTPCodes["NO_CONTENT"] = 204] = "NO_CONTENT";
    HTTPCodes[HTTPCodes["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HTTPCodes[HTTPCodes["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HTTPCodes[HTTPCodes["FORBIDDEN"] = 403] = "FORBIDDEN";
    HTTPCodes[HTTPCodes["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
    HTTPCodes[HTTPCodes["REFUSED"] = 418] = "REFUSED";
    HTTPCodes[HTTPCodes["NOT_FOUND"] = 404] = "NOT_FOUND";
    HTTPCodes[HTTPCodes["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HTTPCodes[HTTPCodes["NOT_IMPLEMENTED"] = 501] = "NOT_IMPLEMENTED";
})(HTTPCodes = exports.HTTPCodes || (exports.HTTPCodes = {}));
class ErrorHandler {
    static isTrustedError(error) {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
    static handleTrustedError(error, response) {
        response.status(error.httpCode).json({
            name: error.name,
            message: error.message,
        });
    }
    static handleCriticalError(e, response) {
        if (response) {
            response.status(HTTPCodes.INTERNAL_SERVER_ERROR).json(Object.assign(Object.assign({}, e), { message: "Internal Server Error" }));
        }
        console.log(`Application encountered critical error. Shutting off`);
        console.log(e);
    }
    static handle(error, res) {
        if (ErrorHandler.isTrustedError(error) && res) {
            ErrorHandler.handleTrustedError(error, res);
        }
        else {
            ErrorHandler.handleCriticalError(error, res);
        }
    }
}
exports.ErrorHandler = ErrorHandler;
class AppError extends Error {
    constructor(args) {
        super(args.description);
        this.isOperational = true;
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = args.name || "Error";
        this.httpCode = args.httpCode;
        if (args.isOperational !== undefined) {
            this.isOperational = args.isOperational;
        }
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
