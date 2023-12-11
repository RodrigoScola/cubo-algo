"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scoring = void 0;
class Scoring {
    constructor() {
        this.numbers = [];
        this.score = 0;
    }
    add(num) {
        this.numbers.push(num);
        return this;
    }
    calculate() {
        this.score = this.numbers.reduce((acc, val) => acc + val, 0) * 100;
    }
}
exports.Scoring = Scoring;
