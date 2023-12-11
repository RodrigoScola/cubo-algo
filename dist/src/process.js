"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = require("./ErrorHandler");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (reason) => {
    throw new Error(reason.message || reason);
});
process.on("uncaughtException", (error) => {
    ErrorHandler_1.ErrorHandler.handle(error, undefined);
});
