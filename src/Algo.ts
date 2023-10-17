import { Marketplace } from "./marketplace";

export class Algo {
  private static marketplaces: Map<number, Marketplace> = new Map();
  constructor() {
    Algo.marketplaces = new Map();
  }
  static getMarketPlace(id: number) {
    return this.marketplaces.get(id);
  }
  static reset() {
    return Promise.all(
      [...Algo.marketplaces].map(([_, marketplace]) => {
        return marketplace.reset();
      })
    );
  }
  static async setup() {
    const marketPlaceNames = [1];
    await Promise.all(
      marketPlaceNames.map((marketplaceId) => {
        const market = new Marketplace(marketplaceId);
        Algo.marketplaces.set(marketplaceId, market);
        return market.setup();
      })
    );
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
