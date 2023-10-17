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
exports.Marketplace = exports.AdInstance = void 0;
const Adhandler_1 = require("./Adhandler");
const server_1 = require("./server");
class MarketplaceScoring {
    calculateScore(instances) {
        instances.forEach((instance) => instance.calculateScore());
    }
    sortScores(ads) {
        return ads.sort((a, b) => b.score - a.score);
    }
}
class Scoring {
    constructor(initialScore) {
        this.numbers = [initialScore];
        this.score = initialScore;
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
        this.type = "product";
        this.info = info;
        this.scoring = new Scoring(info.price);
        this.inRotation = false;
    }
    get score() {
        return this.scoring.score || 0;
    }
    addScore(num) {
        this.scoring.add(num);
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
            if (this.info.skuId === 0) {
                const [sku] = yield Adhandler_1.AdHandler.getBestSku(this.info);
                yield server_1.connection.update({ skuId: sku[0].skuId }).where({ id: this.info.id }).from("ads");
                this.info.skuId = sku[0].skuId;
            }
            const context = yield Adhandler_1.AdHandler.getContext(this.info);
            return (this.currentContext = Object.assign(Object.assign({}, context), { score: this.score }));
        });
    }
    calculateScore() {
        this.addScore(Math.floor((Math.random() * 100) % this.score));
        this.scoring.calculate();
        return this.scoring.score;
    }
}
exports.AdInstance = AdInstance;
class Marketplace {
    constructor(id) {
        this.totalAdsPerBatch = 3;
        this.id = id;
        this.scoring = new MarketplaceScoring();
        this.ads = [];
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const products = yield (0, server_1.connection)("ads").select("*").where("marketplaceId", this.id);
            products.forEach((product) => {
                this.addAd(product);
            });
            this.calculateScores();
            return yield Promise.all([Adhandler_1.AdHandler.getAdsContext(this.ads), this.saveScores()]);
        });
    }
    start() {
        this.ads.forEach((ad, i) => {
            if (i < this.totalAdsPerBatch) {
                ad.inRotation = true;
            }
        });
    }
    calculateScores() {
        this.scoring.calculateScore(this.ads);
        this.ads = this.scoring.sortScores(this.ads);
    }
    saveScores() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.ads.map((ad) => {
                return (0, server_1.connection)("ads").update({ score: ad.score }).where("id", ad.info.id);
            }));
        });
    }
    getAds(type) {
        return this.ads.reduce((acc, item) => {
            if (item.inRotation && item.context && item.type === type) {
                acc.push(item.context);
            }
            return acc;
        }, []);
    }
    getAllAds() {
        return this.ads;
    }
    getAd(id) {
        return this.ads.find((ad) => ad.info.id === id);
    }
    reset() {
        this.ads = [];
        return (0, server_1.connection)("ads").update({ score: 0 }).where("marketPlace", this.id);
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([this.calculateScores(), this.saveScores()]);
            for (let i = 0; i < this.ads.length; i++) {
                const ad = this.ads[i];
                if (!ad)
                    continue;
                ad.inRotation = i < this.totalAdsPerBatch;
            }
        });
    }
    addAd(ad) {
        const instance = new AdInstance(ad);
        this.ads.push(instance);
        return instance;
    }
}
exports.Marketplace = Marketplace;
