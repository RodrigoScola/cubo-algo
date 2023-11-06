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
        instances.forEach((instance) => {
            if (instance.context && "views" in instance.context)
                instance.scoring.add(instance.context.ctr);
            instance.calculateScore();
        });
    }
    sortScores(ads) {
        return ads.sort((a, b) => b.score - a.score);
    }
}
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
        this.numbers.push(num);
    }
    set(num) {
        this._score = num;
    }
    calculate() {
        this._score = 0;
        this.numbers.forEach((number) => {
            this._score += number;
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
    canGetInRotation() {
        return !!this.context;
    }
    get score() {
        return this.scoring.score || 0;
    }
    addScore(num) {
        this.scoring.add(num);
    }
    getContext() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context) {
                return Promise.resolve(this.context);
            }
            if (this.info.skuId === 0) {
                const skuId = yield Adhandler_1.AdHandler.getBestSku(this.info);
                if (!skuId)
                    return;
                yield server_1.connection.update({ skuId }).where({ id: this.info.id }).from("ads");
                this.info.skuId = skuId;
            }
            const context = yield Adhandler_1.AdHandler.getContext(this.info);
            this.scoring.set((_a = context === null || context === void 0 ? void 0 : context.ctr) !== null && _a !== void 0 ? _a : 0);
            return (this.context = Object.assign(Object.assign({}, context), { score: this.score }));
        });
    }
    calculateScore() {
        this.scoring.calculate();
        return this.scoring.score;
    }
}
exports.AdInstance = AdInstance;
class AdManager {
    constructor(adInstances) {
        this.ads = adInstances;
    }
}
class Marketplace {
    constructor(id) {
        this.totalAdsPerBatch = 3;
        this.id = id;
        this.scoring = new MarketplaceScoring();
        this.ads = [];
        this.productAds = new AdManager(this.ads);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const products = yield (0, server_1.connection)("ads").select("*").where("marketplaceId", this.id).andWhere("isActive", 1);
            products.forEach((product) => {
                this.addAd(product);
            });
            this.calculateScores();
            return yield Promise.all([Adhandler_1.AdHandler.getAdsContext(this.productAds.ads), this.saveScores()]);
        });
    }
    start() {
        this.productAds.ads.forEach((ad, i) => {
            if (i < this.totalAdsPerBatch) {
                ad.inRotation = true;
            }
        });
    }
    calculateScores() {
        this.scoring.calculateScore(this.productAds.ads);
        this.productAds.ads = this.scoring.sortScores(this.productAds.ads);
    }
    saveScores() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.productAds.ads.map((ad) => {
                return (0, server_1.connection)("ads").update({ score: ad.score }).where("id", ad.info.id);
            }));
        });
    }
    getAds() {
        return this.ads.reduce((acc, item) => {
            if (item.inRotation && item.canGetInRotation()) {
                acc.push(item.context);
            }
            return acc;
        }, []);
    }
    getAllAds() {
        return this.ads;
    }
    getAd(id) {
        return this.productAds.ads.find((ad) => ad.info.id === id);
    }
    reset() {
        this.productAds.ads = [];
        return (0, server_1.connection)("ads").update({ score: 0 }).where("marketplaceId", this.id).andWhere("isActive", 1);
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
