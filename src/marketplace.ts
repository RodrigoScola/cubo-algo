import { AdHandler } from "./Adhandler";
import { AdInstance } from "./adInstance";
import { connection } from "./server";
import { AdContext } from "./types/types";

class MarketplaceScoring {
  calculateScore(instances: AdInstance[]) {
    instances.forEach((instance) => {

      instance.scoring.add(instance.context?.ctr);
      instance.scoring.add(instance.context?.inventory.total);
      instance.scoring.add(-instance.scoring.score);

      instance.calculateScore();
    });
  }

  sortScores(ads: AdInstance[]) {
    return ads.sort((a, b) => b.score - a.score);
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
    const products = await connection("ads").select("*").where("marketplaceId", this.id).andWhere("status", 1);

    products.forEach((product) => {
      this.addAd(new AdInstance(product));
    });
    this.calculateScores();

    await Promise.all([AdHandler.getAdsContext(this.ads), this.saveScores()]);

    return;
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
    this.ads = this.scoring.sortScores(this.ads);

    this.ads.forEach((ad, i) => {
      if (i < this.totalAdsPerBatch && ad.canGetRotation) {
        ad.inRotation = true;
      }
    });
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
    const adsIds = this.ads.map((ad) => ad.info.id);

    const newProducts = await connection("ads")
      .select("*")
      .where("marketplaceId", this.id)
      .andWhere("status", 1)
      .whereNotIn("id", adsIds);

    newProducts.forEach((product) => {
      return this.addAd(new AdInstance(product));
    });
    await Promise.all([
      this.calculateScores(),
      this.saveScores(),
    ]);
    AdHandler.getAdsContext(this.ads);

  }

  addAd(ad: AdInstance) {
    const id = this.ads.find((x) => x.info.id === ad.info.id)?.info.id;

    if (!id) {
      this.ads.push(ad);
    }

    return ad;
  }
}
