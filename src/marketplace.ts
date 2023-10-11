import { AdHandler } from "./Adhandler";
import { connection } from "./server";
import { AdContext, AdInfo, NewAdInfo } from "./types/types";

class Scoring {
  private numbers: number[];
  score: number;
  constructor() {
    this.numbers = [];
    this.score = 0;
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

class AdInstance {
  info: AdInfo;
  private currentContext?: AdContext;
  scoring: Scoring;
  inRotation: boolean;

  constructor(info: AdInfo) {
    this.info = info;
    this.scoring = new Scoring();
    this.inRotation = false;
  }

  get score() {
    return this.scoring.score;
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
    const context = await AdHandler.getContext(this.info);

    this.currentContext = {
      ...context,
      score: this.score,
    } as AdContext;
  }
  calculateScore(): number {
    this.scoring.add(this.info.price);
    this.scoring.calculate();
    return this.scoring.score;
  }
}

export class Marketplace {
  name: string;
  private ads: AdInstance[];
  private readonly totalAdsPerBatch = 3;
  constructor(name: string) {
    this.name = name;
    this.ads = [];
  }
  getProducts() {
    return connection("ads").select("*").where("marketPlace", this.name);
  }
  async setup() {
    const products = await this.getProducts();
    products.forEach((product) => {
      this.addAd(product);
    });
    this.sortScores();
    this.calculateScores();
    return await Promise.all([this.getAdsContext(), this.saveScores()]);
  }
  async postProduct(info: NewAdInfo) {
    const [items] = await AdHandler.getBestSku(info);

    return AdHandler.postProduct({
      ...info,

      skuId: items[0].skuId satisfies number,
    });
  }
  sortScores() {
    this.ads = this.ads.sort((a, b) => b.score - a.score);
  }
  start() {
    console.log("starting marketplace");
    this.ads.forEach((ad, i) => {
      if (i < this.totalAdsPerBatch) {
        ad.inRotation = true;
      }
    });
  }
  calculateScores() {
    this.ads.forEach((ad) => ad.calculateScore());
    this.sortScores();
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
  private async getAdsContext(): Promise<(AdContext | undefined)[]> {
    return await Promise.all(
      this.ads.map((ad) => {
        return ad.getContext();
      })
    );
  }
  reset() {
    this.ads = [];
    return connection("ads").update({ score: 0 }).where("marketPlace", this.name);
  }
  refresh() {
    this.calculateScores();
  }

  addAd(ad: AdInfo) {
    console.log("adding ad");
    const instance = new AdInstance(ad);
    this.ads.push(instance);
    return instance;
  }
}
