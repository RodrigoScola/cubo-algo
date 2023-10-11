import { Marketplace } from "./marketplace";

export class Algo {
  private static marketplaces: Map<string, Marketplace> = new Map();
  constructor() {
    Algo.marketplaces = new Map();
  }
  static getMarketPlace(name: string) {
    return this.marketplaces.get(name);
  }
  static reset() {
    Algo.marketplaces.forEach((market) => {
      market.reset();
    });
  }
  static async setup() {
    const marketPlaceNames = ["wecode"];
    await Promise.all(
      marketPlaceNames.map((marketplaceName) => {
        const market = new Marketplace(marketplaceName);
        Algo.marketplaces.set(marketplaceName, market);
        return market.setup();
      })
    );
  }
  static calculateScores() {
    Algo.marketplaces.forEach((market) => {
      market.calculateScores();
    });
  }
}
