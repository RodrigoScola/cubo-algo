"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdInstance = void 0;
const Adhandler_1 = require("./Adhandler");
const server_1 = require("./server");
class Scoring {
    constructor(initialScore) {
        this.numbers = [initialScore];
        this._score = initialScore;
        this.baseScore = initialScore;
    }
    get score() {
        return this._score;
    }
    add(num) {
        if (!num)
            return;
        this.numbers.push(num);
    }
    set(num) {
        this._score = num;
    }
    calculate() {
        this._score = 0;
        this.numbers.forEach((number) => {
            this._score += number * 100;
        });
        this.numbers = [];
        return this.score;
    }
    reset() {
        this.numbers = [];
        this._score = this.baseScore;
    }
}
class AdInstance {
    constructor(info) {
        this.type = "product";
        this.info = info;
        this.scoring = new Scoring(0);
        this.inRotation = false;
    }
    get canGetRotation() {
        if (!this.context || this.context.inventory.total <= 0)
            return false;
        return true;
    }
    get score() {
        return this.scoring.score || 0;
    }
    addScore(num) {
        this.scoring.add(num);
    }
    getContext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context)
                return this.context;
            if (this.info.skuId === 0) {
                const skuId = yield Adhandler_1.AdHandler.getBestSku(this.info);
                if (!skuId)
                    return;
                yield server_1.connection.update({ skuId }).where({ id: this.info.id }).from("ads");
                this.info.skuId = skuId;
            }
            const context = yield Adhandler_1.AdHandler.getContext(this.info);
            this.context = Object.assign(Object.assign({}, context), { score: this.score });
            return this.context;
        });
    }
    calculateScore() {
        this.scoring.calculate();
        return this.scoring.score;
    }
}
exports.AdInstance = AdInstance;
