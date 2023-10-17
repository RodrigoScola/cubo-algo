"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExponentialBackoff = void 0;
function getExponentialBackoff(num) {
    const max = Math.pow(2, num);
    const min = 1;
    const range = max - min;
    const random = Math.random();
    const scaled = Math.pow(random, num);
    const result = Math.floor(min + scaled * range);
    return result;
}
exports.getExponentialBackoff = getExponentialBackoff;
