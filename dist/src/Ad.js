"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ad = void 0;
const scoring_1 = require("./lib/scoring");
class Ad {
    constructor(info) {
        this.context = info;
        this.scoring = new scoring_1.Scoring();
    }
    get score() {
        return this.scoring.score;
    }
    set score(num) {
        this.scoring.add(num);
    }
    get info() {
        return {
            id: this.context.id,
            status: this.context.status,
            skuId: this.context.skuId,
            productId: this.context.productId,
            name: this.context.name,
            description: this.context.description,
            title: this.context.title,
            metaTagDescription: this.context.metaTagDescription,
            images: this.context.images,
        };
    }
}
exports.Ad = Ad;
