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
exports.Algo = exports.SETTINGS_FLAGS = exports.isSettingType = void 0;
const marketplace_1 = require("./marketplace");
function isSettingType(settingName) {
    return Object.keys(exports.SETTINGS_FLAGS).includes(settingName);
}
exports.isSettingType = isSettingType;
exports.SETTINGS_FLAGS = {
    viewWeight: 1,
    countViews: true,
    exponentialBackoff: true,
};
class Algo {
    constructor() {
        Algo.marketplaces = new Map();
    }
    static getMarketPlace(id) {
        return this.marketplaces.get(id);
    }
    static reset() {
        return Promise.all([...Algo.marketplaces].map(([_, marketplace]) => {
            return marketplace.reset();
        }));
    }
    static setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const marketPlaceNames = [1];
            yield Promise.all(marketPlaceNames.map((marketplaceId) => {
                const market = new marketplace_1.Marketplace(marketplaceId);
                Algo.marketplaces.set(marketplaceId, market);
                return market.setup();
            }));
        });
    }
    static start() {
        this.marketplaces.forEach((marketplace) => {
            marketplace.start();
        });
    }
    static refresh() {
        Algo.marketplaces.forEach((market) => {
            market.refresh();
        });
    }
    static calculateScores() {
        Algo.marketplaces.forEach((market) => {
            market.calculateScores();
        });
    }
}
exports.Algo = Algo;
Algo.marketplaces = new Map();
