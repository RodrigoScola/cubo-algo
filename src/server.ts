import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { AppError, ErrorHandler, HTTPCodes } from "./ErrorHandler";
import { AdContext, AdInfo, NewAdInfo } from "./types/types";
require("dotenv").config();

const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
};
const knex = Kcon(config);

const server = express();

server.use(express.json());

class AdHandler {
  getContext(adInfo: AdInfo) {
    return AdHandler.getContext(adInfo);
  }
  postProduct(info: NewAdInfo) {
    return knex("ads").insert(info).returning("id");
  }
  static async getContext(adInfo: AdInfo) {
    const itemPromise = await knex<AdContext>("ads")
      .select("*")
      .join("sku", function () {
        this.on("ads.skuId", "=", "sku.id");
      })
      .where("ads.id", adInfo.id)
      .join("products", function () {
        this.on("products.id", "=", "ads.productId");
      })
      .first();

    const imagesPromise = knex("sku_file").select("isMain", "url", "name").where("skuId", adInfo.skuId);

    const [item, images] = await Promise.all([itemPromise, imagesPromise]);

    if (!item) return;

    item.images = images;

    return item;
  }
  getBestSku(ad: NewAdInfo) {
    return knex.raw(`
    select sum(si.totalQuantity) as totalQuantity, si.skuId, s.productId from sku_inventory as si left join sku as s on si.skuId = s.id where s.productId = ${ad.productId} group by skuId order by totalQuantity desc
    `);
  }
}
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
  getCurrent() {
    return this.ads.slice(0, 10);
  }
  async setup() {
    const products = await knex("ads").select("*").where("marketPlace", this.name);
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
  async postProduct(info: AdInfo) {
    const instance = new AdInstance(info);
    this.ads.push(instance);
    await this.calculateScores();
  }
  async calculateScores() {
    return await Promise.all(this.ads.map((ad) => ad.calculateScore()));
  }
  async saveScores() {
    console.log("saving scores");
    return await Promise.all(
      this.ads.map((ad) => {
        return knex("ads").update({ score: ad.score }).where("id", ad.info.id);
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
    knex("ads").where("marketPlace", this.name).del();
  }
  addAd(ad: AdInfo) {
    const instance = new AdInstance(ad);
    this.ads.push(instance);
    instance.calculateScore();
  }
}

class Algo {
  private marketplaces: Map<string, Marketplace>;
  constructor() {
    this.marketplaces = new Map();
  }
  reset() {
    return knex.delete("*").from("ads");
  }
  getMarketPlace(name: string) {
    return this.marketplaces.get(name);
  }
  async setup() {
    const marketPlaceNames = ["wecode"];
    await Promise.all(
      marketPlaceNames.map((marketplaceName) => {
        const market = new Marketplace(marketplaceName);
        this.marketplaces.set(marketplaceName, market);
        return market.setup();
      })
    );
  }
  async postProduct(info: NewAdInfo) {
    const handler = new AdHandler();
    const [skus, _] = await handler.getBestSku(info);
    console.log({});

    return knex("ads")
      .insert({
        ...info,
        skuId: skus[0].skuId,
      })
      .returning("id");
  }
  calculateScores() {
    [...this.marketplaces.values()].forEach((market) => {
      market.calculateScores();
    });
  }
}

const algo = new Algo();
server.param("marketPlaceId", (req, res, next, marketplaceId) => {
  if (!algo.getMarketPlace(marketplaceId)) {
    throw new AppError({
      description: `Marketplace ${marketplaceId} not found`,
      httpCode: HTTPCodes.NOT_FOUND,
    });
  }
  req.marketplace = algo.getMarketPlace(marketplaceId);
  next();
});
server.get("/marketplace/:marketPlaceId", async (req, res) => {
  const data = await req.marketplace?.getAds();
  res.send({
    data: data,
  });
});
server.post("/marketplace/:marketPlaceId", async (req, res) => {
  if (!req.marketplace) {
    throw new AppError({
      description: "marketplace is required",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  if (!("products" in req.body)) {
    throw new AppError({
      description: "products is required",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  if (!Array.isArray(req.body.products)) {
    throw new AppError({
      description: "products must be an array",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const products = req.body.products as NewAdInfo[];

  const ids = await Promise.all(
    products.map(async (product) => {
      return await algo.postProduct(product);
    })
  );
  return res.json({
    data: {
      ids,
      products,
    },
  });
});
server.get("/calculateScores", (req, res) => {
  algo.calculateScores();
  return res.json({
    message: "done",
  });
});
server.get("/reset", async (req, res) => {
  await algo.reset();
  return res.json({
    message: "done",
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
  ErrorHandler.handle(err, res);
};
server.use(EFunction);

server.listen(process.env.PORT, async () => {
  console.clear();
  await algo.setup();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
