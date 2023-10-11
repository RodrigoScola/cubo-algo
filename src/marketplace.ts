import { AdHandler } from "./Adhandler";
import { connection } from "./server";
import { AdContext, AdInfo, NewAdInfo } from "./types/types";

class AdInstance {
  info: AdInfo;
  context?: AdContext;
  score: number;
  constructor(info: AdInfo) {
    this.info = info;
    this.score = 0;
  }
  async getContext() {
    if (!this.context) {
      const context = await AdHandler.getContext(this.info);
      this.context = context;
    }
    return Promise.resolve(this.context);
  }
  calculateScore(): Promise<number> {
    this.score = this.info.price;
    console.log(this.score);
    return Promise.resolve(this.score);
  }
}

export class Marketplace {
  name: string;
  private ads: AdInstance[];

  constructor(name: string) {
    this.name = name;
    this.ads = [];
  }
  async setup() {
    const products = await connection("ads").select("*").where("marketPlace", this.name);
    products.forEach((product) => {
      const instance = new AdInstance(product);
      this.ads.push(instance);
      instance.calculateScore();
    });
    this.ads = this.ads.sort((a, b) => a.score - b.score);
    return await Promise.all([
      this.ads.map(async (ad) => {
        return await ad.getContext();
      }),
      this.saveScores(),
    ]);
  }
  async postProduct(info: NewAdInfo) {
    const [items, _] = await AdHandler.getBestSku(info);

    return AdHandler.postProduct({
      ...info,

      skuId: items[0].skuId satisfies number,
    });
  }
  async calculateScores() {
    return await Promise.all(this.ads.map((ad) => ad.calculateScore()));
  }
  async saveScores() {
    console.log("saving scores");
    return await Promise.all(
      this.ads.map((ad) => {
        return connection("ads").update({ score: ad.score }).where("id", ad.info.id);
      })
    );
  }
  async getAds(): Promise<(AdContext | undefined)[]> {
    return await Promise.all(
      this.ads.map((ad) => {
        return ad.getContext();
      })
    );
  }
  reset() {
    connection("ads").where("marketPlace", this.name).del();
  }
  addAd(ad: AdInfo) {
    const instance = new AdInstance(ad);
    this.ads.push(instance);
    instance.calculateScore();
  }
}
