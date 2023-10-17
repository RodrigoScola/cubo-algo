"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFactory = exports.LogTypes = exports.ViewLogType = void 0;
class ViewLogType {
    log(arg) {
        console.log(arg);
    }
}
exports.ViewLogType = ViewLogType;
exports.LogTypes = {
    view: ViewLogType,
};
class LogFactory {
    getLog(type) {
        return new exports.LogTypes[type]();
    }
}
exports.logFactory = new LogFactory();
