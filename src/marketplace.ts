import { AdHandler } from "./Adhandler";
import { SETTINGS_FLAGS } from "./Algo";
import { connection } from "./server";
import { AdContext, AdInfo } from "./types/types";

class MarketplaceScoring {
  calculateScore(instances: AdInstance[]) {
    const max = instances[0];
    instances.forEach((instance) => {
      if (SETTINGS_FLAGS.exponentialBackoff) {
        const score = max?.score ?? 0;
        instance.addScore(
          Math.floor(Math.random() * instance.info.price) % score
        );
      }
      instance.calculateScore();
    });
  }

  sortScores(ads: AdInstance[]) {
    return ads.sort((a, b) => b.score - a.score);
  }
}

class Scoring {
  private numbers: number[];
  score: number;
  private readonly baseScore;
  constructor(initialScore: number) {
    this.numbers = [initialScore];
    this.score = initialScore;
    this.baseScore = initialScore;
  }
  add(num: number) {
    this.numbers.push(num);
  }
  calculate() {
    this.score = 0;

    this.numbers.forEach((number) => {
      this.score += number;
    });

    return this.score;
  }
  reset() {
    this.numbers = [];
    this.score = this.baseScore;
  }
}

export class AdInstance {
  info: AdInfo;
  private currentContext?: AdContext;
  scoring: Scoring;
  type: "product" | "banner";
  properties: {
    views: number;
  };
  inRotation: boolean;

  constructor(info: AdInfo) {
    this.type = "product";
    this.info = info;
    this.scoring = new Scoring(info.price);
    this.inRotation = false;
    this.properties = {
      views: 0,
    };
  }

  get score() {
    return this.scoring.score || 0;
  }
  addScore(num: number) {
    this.scoring.add(num);
  }

  get context() {
    if (!this.currentContext) {
      return undefined;
    }
    return {
      ...this.currentContext,
      score: this.score,
    };
  }
  async getContext() {
    if (this.context) {
      return Promise.resolve(this.context);
    }
    if (this.info.skuId === 0) {
      const skuId = await AdHandler.getBestSku(this.info);

      if (!skuId) return;

      await connection
        .update({ skuId })
        .where({ id: this.info.id })
        .from("ads");

      this.info.skuId = skuId;
    }

    const context = await AdHandler.getContext(this.info);

    return (this.currentContext = {
      ...context,
      score: this.score,
    } as AdContext);
  }
  calculateScore(): number {
    this.scoring.calculate();
    return this.scoring.score;
  }
}

class AdManager {
  ads: AdInstance[];
  constructor(adInstances: AdInstance[]) {
    this.ads = adInstances;
  }
}

export class Marketplace {
  private products: AdManager;

  private scoring: MarketplaceScoring;
  private readonly totalAdsPerBatch = 3;
  readonly id: number;
  constructor(id: number) {
    this.id = id;
    this.scoring = new MarketplaceScoring();
    this.products = new AdManager([]);
  }
  async setup() {
    const products = await connection("ads")
      .select("*")
      .where("marketplaceId", this.id);

    products.forEach((product) => {
      this.addAd(product);
    });
    this.calculateScores();
    return await Promise.all([
      AdHandler.getAdsContext(this.products.ads),
      this.saveScores(),
    ]);
  }
  start() {
    this.products.ads.forEach((ad, i) => {
      if (i < this.totalAdsPerBatch) {
        ad.inRotation = true;
      }
    });
  }
  calculateScores() {
    this.scoring.calculateScore(this.products.ads);
    this.products.ads = this.scoring.sortScores(this.products.ads);
  }
  async saveScores() {
    return await Promise.all(
      this.products.ads.map((ad) => {
        return connection("ads")
          .update({ score: ad.score })
          .where("id", ad.info.id);
      })
    );
  }

  getAds(type: "product" | "banner"): AdContext[] {
    return this.products.ads.reduce((acc: AdContext[], item) => {
      if (item.inRotation && item.context && item.type === type) {
        acc.push(item.context);
      }
      return acc;
    }, []);
  }
  getAllAds() {
    return this.products;
  }
  getAd(id: number): AdInstance | undefined {
    return this.products.ads.find((ad) => ad.info.id === id);
  }
  reset() {
    this.products.ads = [];

    return connection("ads")
      .update({ score: 0 })
      .where("marketplaceId", this.id);
  }
  async refresh() {
    await Promise.all([this.calculateScores(), this.saveScores()]);
    for (let i = 0; i < this.products.ads.length; i++) {
      const ad = this.products.ads[i];
      if (!ad) continue;

      ad.inRotation = i < this.totalAdsPerBatch;
    }
  }

  addAd(ad: AdInfo) {
    const instance = new AdInstance(ad);
    this.products.ads.push(instance);
    return instance;
  }
}
