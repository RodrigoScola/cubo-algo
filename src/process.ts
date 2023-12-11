import { ErrorHandler } from "./ErrorHandler";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (reason: Error | any) => {
    throw new Error(reason.message || reason);
});

process.on("uncaughtException", (error: Error) => {
    ErrorHandler.handle(error, undefined);
});
