"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFactory = exports.isLogType = exports.LogTypes = exports.ViewLogType = void 0;
const Algo_1 = require("../Algo");
class ViewLogType {
    constructor(viewWeight) {
        this.viewWeight = viewWeight;
    }
    log(arg) {
        var _a;
        arg.addScore(this.viewWeight);
        arg.properties.views++;
        console.log((_a = arg.context) === null || _a === void 0 ? void 0 : _a.title, "was viewed by a user.");
    }
}
exports.ViewLogType = ViewLogType;
exports.LogTypes = {
    view: ViewLogType,
};
function isLogType(type) {
    return !!exports.LogTypes[type];
}
exports.isLogType = isLogType;
class LogFactory {
    getLog(type) {
        return new exports.LogTypes[type](Algo_1.SETTINGS_FLAGS.viewWeight);
    }
}
exports.logFactory = new LogFactory();
