import { AdHandler } from "./Adhandler";
import { connection } from "./server";
import { AdContext, AdInfo } from "./types/types";

class MarketplaceScoring {
  calculateScore(instances: AdInstance[]) {
    instances.forEach((instance) => instance.calculateScore());
  }
  sortScores(ads: AdInstance[]) {
    return ads.sort((a, b) => b.score - a.score);
  }
}

class Scoring {
  private numbers: number[];
  score: number;
  constructor(initialScore: number) {
    this.numbers = [initialScore];
    this.score = initialScore;
  }
  add(num: number) {
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

export class AdInstance {
  info: AdInfo;
  private currentContext?: AdContext;
  scoring: Scoring;
  inRotation: boolean;

  constructor(info: AdInfo) {
    this.info = info;
    this.scoring = new Scoring(info.price);
    this.inRotation = false;
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
      const [sku] = await AdHandler.getBestSku(this.info);
      await connection.update({ skuId: sku[0].skuId }).where({ id: this.info.id }).from("ads");

      this.info.skuId = sku[0].skuId;
    }

    const context = await AdHandler.getContext(this.info);

    return (this.currentContext = {
      ...context,
      score: this.score,
    } as AdContext);
  }
  calculateScore(): number {
    this.addScore(Math.floor((Math.random() * 100) % this.score));
    this.scoring.calculate();
    return this.scoring.score;
  }
}

export class Marketplace {
  private ads: AdInstance[];
  private scoring: MarketplaceScoring;
  private readonly totalAdsPerBatch = 3;
  readonly id: number;
  constructor(id: number) {
    this.id = id;
    this.scoring = new MarketplaceScoring();
    this.ads = [];
  }
  async setup() {
    const products = await connection("ads").select("*").where("marketplaceId", this.id);

    products.forEach((product) => {
      this.addAd(product);
    });
    this.calculateScores();
    return await Promise.all([AdHandler.getAdsContext(this.ads), this.saveScores()]);
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
  async saveScores() {
    return await Promise.all(
      this.ads.map((ad) => {
        return connection("ads").update({ score: ad.score }).where("id", ad.info.id);
      })
    );
  }
  getAds(): AdContext[] {
    return this.ads.reduce((acc: AdContext[], item) => {
      if (item.inRotation && item.context) {
        acc.push(item.context);
      }
      return acc;
    }, []);
  }
  getAllAds() {
    return this.ads;
  }
  getAd(id: number): AdInstance | undefined {
    return this.ads.find((ad) => ad.info.id === id);
  }
  reset() {
    this.ads = [];
    return connection("ads").update({ score: 0 }).where("marketPlace", this.id);
  }
  async refresh() {
    await Promise.all([this.calculateScores(), this.saveScores()]);
    for (let i = 0; i < this.ads.length; i++) {
      const ad = this.ads[i];
      if (!ad) continue;

      ad.inRotation = i < this.totalAdsPerBatch;
    }
  }

  addAd(ad: AdInfo) {
    const instance = new AdInstance(ad);
    this.ads.push(instance);
    return instance;
  }
}
