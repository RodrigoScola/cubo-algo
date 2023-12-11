
import { Scoring } from './lib/scoring';
import { AdInstanceInfo } from './types/types';
export class Ad {
    readonly context: AdInstanceInfo;
    readonly scoring: Scoring;

    constructor(info: AdInstanceInfo) {
        this.context = info;
        this.scoring = new Scoring();
    }
    get score() {
        return this.scoring.score;
    }
    set score(num: number) {
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
            linkId: `${this.context.linkId}/p`,
            images: this.context.images,
        };
    }
}