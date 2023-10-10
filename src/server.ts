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
async function getAdContext(ad: AdInfo) {
  const itemPromise = await knex<AdContext>("ads")
    .select("*")
    .join("sku", function () {
      this.on("ads.skuId", "=", "sku.id");
    })
    .where("ads.id", ad.id)
    .join("products", function () {
      this.on("products.id", "=", "ads.productId");
    })
    .first();

  const imagesPromise = knex("sku_file").select("isMain", "url", "name").where("skuId", ad.skuId);

  const [item, images] = await Promise.all([itemPromise, imagesPromise]);

  if (!item) return;

  item.images = images;

  return item;
}

class Algo {
  products: AdInfo[];
  marketplaces: Map<string, number[]>;
  contexts: Map<number, AdContext>;
  constructor() {
    this.products = [];
    this.marketplaces = new Map();
    this.contexts = new Map();
  }
  addProduct(product: AdInfo) {
    if (!this.products.find((item) => item.id === product.id)) {
      this.products.push(product);
      this.addToMarketplace(product);
    }
  }
  getBestSkuId(ad: NewAdInfo) {
    return knex.raw(`
    select sum(si.totalQuantity) as totalQuantity, si.skuId, s.productId from sku_inventory as si left join sku as s on si.skuId = s.id where s.productId = ${ad.productId} group by skuId order by totalQuantity desc
    `);
  }
  async postProduct(product: NewAdInfo) {
    const [items, _] = await this.getBestSkuId(product);

    return knex("ads").insert({
      ...product,
      skuId: items[0].skuId,
    });
  }
  reset() {
    return knex.delete("*").from("ads");
  }
  calculateScore(ad: AdInfo) {
    const score = ad.price * 2;

    return knex("ads").update("score", score).where("id", ad.id);
  }
  addToMarketplace(product: AdInfo) {
    if (this.marketplaces.get(product.marketPlace)) {
      const items = this.marketplaces.get(product.marketPlace) || [];
      items.push(product.id);
      this.marketplaces.set(product.marketPlace, items);
      return;
    }
    this.marketplaces.set(product.marketPlace, [product.id]);
  }
  getByMarketplace(marketplace: string) {
    const ids = this.marketplaces.get(marketplace);
    // console.log(ids);
    if (!ids) return [];

    return ids.map((id) => {
      return this.contexts.get(id);
    });
  }

  async setup() {
    const marketplaces = ["wecode"];

    const items = await Promise.all(
      marketplaces.map((marketplace) => {
        return knex("ads").select("*").where("marketPlace", marketplace).limit(3);
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
    const context = await getAdContext(baseAd);
    // console.log(context);
    if (!context) return;
    this.contexts.set(baseAd.id, context satisfies AdContext);
    return context;
  }
}

const algo = new Algo();

algo.marketplaces.set("wecode", []);

server.get("/", async (req, res) => {
  const products = algo.getByMarketplace("wecode");

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
