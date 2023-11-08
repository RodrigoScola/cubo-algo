import { AdHandler } from "./Adhandler";
import { connection } from "./server";
import { AdContext, AdInfo } from "./types/types";

class MarketplaceScoring {
  calculateScore(instances: AdInstance[]) {
    instances.forEach((instance) => {
      if (instance.context && "views" in instance.context) instance.scoring.add(instance.context.ctr);
      instance.calculateScore();
    });
  }

  sortScores(ads: AdInstance[]) {
    return ads.sort((a, b) => b.score - a.score);
  }
}

class Scoring {
  private numbers: number[];
  private _score: number;

  private readonly baseScore;
  constructor(initialScore: number) {
    this.numbers = [initialScore];
    this._score = initialScore;
    this.baseScore = initialScore;
  }
  get score() {
    return this._score;
  }
  add(num: number) {
    this.numbers.push(num);
  }
  set(num: number) {
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

export class AdInstance {
  info: AdInfo;
  context?: AdContext;
  scoring: Scoring;
  type: "product" | "banner";
  inRotation: boolean;

  constructor(info: AdInfo) {
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
  addScore(num: number) {
    this.scoring.add(num);
  }

  async getContext() {
    if (this.context) {
      return Promise.resolve(this.context);
    }
    if (this.info.skuId === 0) {
      const skuId = await AdHandler.getBestSku(this.info);

      if (!skuId) return;

      await connection.update({ skuId }).where({ id: this.info.id }).from("ads");

      this.info.skuId = skuId;
    }

    const context = await AdHandler.getContext(this.info);

    this.scoring.set(context?.ctr ?? 0);
    return (this.context = {
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
  productAds: AdManager;

  private ads: AdInstance[];
  private scoring: MarketplaceScoring;
  private readonly totalAdsPerBatch = 3;
  readonly id: number;
  constructor(id: number) {
    this.id = id;
    this.scoring = new MarketplaceScoring();
    this.ads = [];
    this.productAds = new AdManager(this.ads);
  }
  async setup() {
    const products = await connection("ads").select("*").where("marketplaceId", this.id).andWhere("status", 1);

    products.forEach((product) => {
      this.addAd(product);
    });
    this.calculateScores();
    return await Promise.all([AdHandler.getAdsContext(this.productAds.ads), this.saveScores()]);
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
  async saveScores() {
    return await Promise.all(
      this.productAds.ads.map((ad) => {
        return connection("ads").update({ score: ad.score }).where("id", ad.info.id);
      })
    );
  }
  getAds(): AdContext[] {
    return this.ads.reduce((acc: AdContext[], item) => {
      if (item.inRotation && item.canGetInRotation()) {
        acc.push(item.context!);
      }
      return acc;
    }, []);
  }
  getAllAds() {
    console.log(this.ads);
    return this.ads;
  }
  getAd(id: number): AdInstance | undefined {
    return this.productAds.ads.find((ad) => ad.info.id === id);
  }
  reset() {
    this.ads = [];

    return Promise.all([
      connection("ads").update({ score: 0 }).where("marketplaceId", this.id).andWhere("status", 1),
      connection("interaction").update({
        clicks: 0,
        ctr: 0,
        views: 0,
      }),
    ]);
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
