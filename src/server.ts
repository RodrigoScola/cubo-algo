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
  async getContext(adInfo: AdInfo) {
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
class Marketplace {
  name: string;
  ads: AdInfo[];
  constructor(name: string) {
    this.name = name;
    this.ads = [];
  }
}

class Algo {
  products: AdInfo[];
  marketplaces: Map<string, Marketplace>;
  contextGetter: AdHandler;
  contexts: Map<number, AdContext>;
  constructor() {
    this.products = [];
    this.marketplaces = new Map();
    this.contexts = new Map();
    this.contextGetter = new AdHandler();
  }
  addProduct(product: AdInfo) {
    if (!this.products.find((item) => item.id === product.id)) {
      this.products.push(product);
      this.addToMarketplace(product);
    }
  }
  async getBestSkuId(ad: NewAdInfo) {
    const [items, _] = await this.contextGetter.getBestSku(ad);
    return items.find((x) => x);
  }
  async postProduct(product: NewAdInfo): Promise<number> {
    const item = await this.getBestSkuId(product);

    const adId = await knex("ads").insert({
      ...product,
      skuId: item.skuId,
    });

    return adId[0];
  }
  reset() {
    return knex.delete("*").from("ads");
  }
  calculateScore(ad: AdInfo) {
    const score = ad.price * 2;

    return knex("ads").update("score", score).where("id", ad.id);
  }
  addToMarketplace(product: AdInfo) {
    const marketplace = this.marketplaces.has(product.marketPlace)
      ? this.marketplaces.get(product.marketPlace)
      : new Marketplace(product.marketPlace);
    console.log({
      marketplace,
    });
    marketplace.ads.push(product);
    this.marketplaces.set(product.marketPlace, marketplace);
  }
  getByMarketplace(marketplace: Marketplace) {
    const ids = this.marketplaces.get(marketplace.name)?.ads.map((item) => item.id);
    if (!ids) return [];

    return ids.map((id) => {
      return this.contexts.get(id);
    });
  }

  async setup() {
    const marketplaces = ["wecode"];

    const items = await Promise.all(
      marketplaces.map((marketplaceName) => {
        const marketplaceInstance = new Marketplace(marketplaceName);
        this.marketplaces.set(marketplaceName, marketplaceInstance);
        return knex("ads").select("*").where("marketPlace", marketplaceName).limit(3);
      })
    );

    items.forEach((marketplaceItems) => {
      marketplaceItems.forEach((item) => {
        this.addProduct(item);
      });
    });
    await Promise.all(
      this.products.map(async (item) => {
        return await this.getContext(item);
      })
    );
  }
  async calculateScores() {
    await Promise.all(
      this.products.map((item) => {
        return this.calculateScore(item);
      })
    );
  }
  async getContext(baseAd: AdInfo): Promise<AdContext | undefined> {
    if (this.contexts.has(baseAd.id)) {
      return this.contexts.get(baseAd.id);
    }
    const context = await this.contextGetter.getContext(baseAd);
    if (!context) return;
    this.contexts.set(baseAd.id, context satisfies AdContext);
    return context;
  }
}

const algo = new Algo();

server.get("/", async (req, res) => {
  const products = algo.getByMarketplace(new Marketplace("wecode"));

  return res.json({
    data: {
      products,
    },
  });
});
server.post("/", async (req, res) => {
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
  await Promise.all(
    products.map(async (product) => {
      return await algo.postProduct(product);
    })
  );
  return res.json({
    data: {
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
