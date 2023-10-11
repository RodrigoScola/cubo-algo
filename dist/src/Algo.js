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
exports.Algo = void 0;
const marketplace_1 = require("./marketplace");
class Algo {
    constructor() {
        Algo.marketplaces = new Map();
    }
    static getMarketPlace(name) {
        return this.marketplaces.get(name);
    }
    static reset() {
        return Promise.all([...Algo.marketplaces].map(([_, marketplace]) => {
            return marketplace.reset();
        }));
    }
    static setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const marketPlaceNames = ["wecode"];
            yield Promise.all(marketPlaceNames.map((marketplaceName) => {
                const market = new marketplace_1.Marketplace(marketplaceName);
                Algo.marketplaces.set(marketplaceName, market);
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
Algo.marketplaces = new Map();
exports.Algo = Algo;
