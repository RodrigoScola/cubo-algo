import { Marketplace } from "./marketplace";

export function isSettingType(settingName: string): settingName is keyof typeof SETTINGS_FLAGS {
  return Object.keys(SETTINGS_FLAGS).includes(settingName);
}
export const SETTINGS_FLAGS = {
  viewWeight: 1,
  countViews: true,
  exponentialBackoff: true,
};

export class Algo {
  private static marketplaces: Map<number, Marketplace> = new Map();
  constructor() {
    Algo.marketplaces = new Map();
  }
  static getMarketPlace(id: number): Marketplace | undefined {
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
      marketPlaceNames.map((marketplaceId: number) => {
        const market = new Marketplace(marketplaceId);
        Algo.marketplaces.set(marketplaceId, market);
        return market.setup();
      })
    );
  }

  static start() {
    this.marketplaces.forEach((marketplace: Marketplace) => {
      marketplace.start();
    });
  }
  static refresh() {
    Algo.marketplaces.forEach((market: Marketplace) => {
      market.refresh();
    });
  }
  static calculateScores() {
    Algo.marketplaces.forEach((market) => {
      market.calculateScores();
    });
  }
}
