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
const adInstance_1 = require("./adInstance");
const server_1 = require("./server");
class MarketplaceScoring {
    calculateScore(instances) {
        instances.forEach((instance) => {
            var _a, _b, _c;
            instance.scoring.add(((_a = instance.context) === null || _a === void 0 ? void 0 : _a.inventory.hasInventory) ? 1 : 0);
            if (((_c = (_b = instance.context) === null || _b === void 0 ? void 0 : _b.inventory) === null || _c === void 0 ? void 0 : _c.total) === 0) {
                instance.scoring.add(-instance.scoring.score);
            }
            instance.calculateScore();
        });
    }
    sortScores(ads) {
        return ads.sort((a, b) => b.score * (b.inRotation ? 1 : 0) - a.score * (a.inRotation ? 1 : 0));
    }
}
class Marketplace {
    constructor(id) {
        this.totalAdsPerBatch = 3;
        this.id = id;
        this.scoring = new MarketplaceScoring();
        this.ads = [];
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const products = yield (0, server_1.connection)("ads").select("*").where("marketplaceId", this.id).andWhere("status", 1);
            products.forEach((product) => {
                this.addAd(new adInstance_1.AdInstance(product));
            });
            this.calculateScores();
            yield Promise.all([Adhandler_1.AdHandler.getAdsContext(this.ads), this.saveScores()]);
            return;
        });
    }
    start() {
        this.ads.forEach((ad, i) => {
            if (i < this.totalAdsPerBatch && ad.canGetRotation) {
                ad.inRotation = true;
            }
        });
    }
    calculateScores() {
        this.scoring.calculateScore(this.ads);
        const currentAds = new Map();
        this.ads.forEach((ad) => {
            if (currentAds.size < this.totalAdsPerBatch && ad.canGetRotation) {
                if (!currentAds.has(ad.info.skuId)) {
                    currentAds.set(ad.info.skuId, ad);
                    ad.inRotation = true;
                }
            }
        });
        this.ads = this.scoring.sortScores(this.ads);
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
    getAllAds() {
        return this.ads;
    }
    getAd(id) {
        return this.ads.find((ad) => ad.info.id === id);
    }
    reset() {
        this.ads = [];
        return Promise.all([
            (0, server_1.connection)("ads").update({ score: 0 }).where("marketplaceId", this.id).andWhere("status", 1),
            (0, server_1.connection)("interaction").update({
                clicks: 0,
                ctr: 0,
                views: 0,
            }),
        ]);
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const adsIds = this.ads.map((ad) => ad.info.id);
            const newProducts = yield (0, server_1.connection)("ads")
                .select("*")
                .where("marketplaceId", this.id)
                .andWhere("status", 1)
                .whereNotIn("id", adsIds);
            newProducts.forEach((product) => {
                return this.addAd(new adInstance_1.AdInstance(product));
            });
            yield Promise.all([
                this.calculateScores(),
                this.saveScores(),
            ]);
            Adhandler_1.AdHandler.getAdsContext(this.ads);
        });
    }
    addAd(ad) {
        var _a;
        const id = (_a = this.ads.find((x) => x.info.id === ad.info.id)) === null || _a === void 0 ? void 0 : _a.info.id;
        if (!id) {
            this.ads.push(ad);
        }
        return ad;
    }
}
exports.Marketplace = Marketplace;
