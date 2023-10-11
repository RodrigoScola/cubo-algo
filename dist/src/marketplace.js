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
exports.Marketplace = void 0;
const Adhandler_1 = require("./Adhandler");
const server_1 = require("./server");
class Scoring {
    constructor() {
        this.numbers = [];
        this.score = 0;
    }
    add(num) {
        this.numbers.push(num);
    }
    calculate() {
        let result = 0;
        this.numbers.forEach((number) => {
            result += number;
        });
        return (this.score = result);
    }
}
class AdInstance {
    constructor(info) {
        this.info = info;
        this.scoring = new Scoring();
        this.inRotation = false;
    }
    get score() {
        return this.scoring.score;
    }
    get context() {
        if (!this.currentContext) {
            return undefined;
        }
        return Object.assign(Object.assign({}, this.currentContext), { score: this.score });
    }
    getContext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context) {
                return Promise.resolve(this.context);
            }
            const context = yield Adhandler_1.AdHandler.getContext(this.info);
            return (this.currentContext = Object.assign(Object.assign({}, context), { score: this.score }));
        });
    }
    calculateScore() {
        this.scoring.add(this.info.price);
        this.scoring.calculate();
        return this.scoring.score;
    }
}
class Marketplace {
    constructor(name) {
        this.totalAdsPerBatch = 3;
        this.name = name;
        this.ads = [];
    }
    getProducts() {
        return (0, server_1.connection)("ads").select("*").where("marketPlace", this.name);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const products = yield this.getProducts();
            products.forEach((product) => {
                this.addAd(product);
            });
            this.sortScores();
            this.calculateScores();
            return yield Promise.all([this.getAdsContext(), this.saveScores()]);
        });
    }
    postProduct(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const [items] = yield Adhandler_1.AdHandler.getBestSku(info);
            return Adhandler_1.AdHandler.postProduct(Object.assign(Object.assign({}, info), { skuId: items[0].skuId }));
        });
    }
    sortScores() {
        this.ads = this.ads.sort((a, b) => b.score - a.score);
    }
    start() {
        console.log("starting marketplace");
        this.ads.forEach((ad, i) => {
            if (i < this.totalAdsPerBatch) {
                ad.inRotation = true;
            }
        });
    }
    calculateScores() {
        this.ads.forEach((ad) => ad.calculateScore());
        this.sortScores();
    }
    saveScores() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.ads.map((ad) => {
                return (0, server_1.connection)("ads").update({ score: ad.score }).where("id", ad.info.id);
            }));
        });
    }
    getAds() {
        return this.ads.reduce((acc, item) => {
            if (item.inRotation && item.context) {
                acc.push(item.context);
            }
            return acc;
        }, []);
    }
    getAdsContext() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.ads.map((ad) => {
                return ad.getContext();
            }));
        });
    }
    reset() {
        this.ads = [];
        return (0, server_1.connection)("ads").update({ score: 0 }).where("marketPlace", this.name);
    }
    refresh() {
        this.calculateScores();
    }
    addAd(ad) {
        console.log("adding ad");
        const instance = new AdInstance(ad);
        this.ads.push(instance);
        return instance;
    }
}
exports.Marketplace = Marketplace;
