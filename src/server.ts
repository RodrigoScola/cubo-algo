import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { AdHandler } from "./Adhandler";
import { Algo } from "./Algo";
import { AppError, ErrorHandler, HTTPCodes } from "./ErrorHandler";
import { __DEV__ } from "./constants";
import { logFactory } from "./logging/LogTypes";
import { AdInfo, NewAdInfo } from "./types/types";

const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
  pool: {
    min: 0,
    max: 10,
  },
};
export const connection = Kcon(config);

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.use(["/ads", "/testing"], (req, _, next) => {
  let marketplaceId = Number(req.headers["marketplace"] || req.query["marketplace"] || req.body["marketplace"]);

  if (__DEV__) {
    marketplaceId = 1;
  }

  if (!marketplaceId || typeof marketplaceId !== "number") {
    throw new AppError({ description: "marketplace is invalid", httpCode: HTTPCodes.BAD_REQUEST });
  }
  const marketplace = Algo.getMarketPlace(marketplaceId);
  if (!marketplace) {
    throw new AppError({
      description: `Marketplace ${marketplaceId} not found`,
      httpCode: HTTPCodes.NOT_FOUND,
    });
  }
  req.marketplace = marketplace;
  next();
});

server.get("/ads", (req, res) => {
  const data = req.marketplace?.getAds("product");
  res.send({
    data: data,
  });
});
server.get("/ads/products", (req, res) => {
  const data = req.marketplace?.getAds("product");
  res.send({
    data: data,
  });
});
server.get("/testing/ads", (req, res) => {
  const data = req.marketplace?.getAllAds();
  res.render("home", { data: { products: data } });
});

server.post("/ads", async (req, res) => {
  const marketplace = req.marketplace;

  if (!marketplace) throw new AppError({ description: "marketplace is required", httpCode: HTTPCodes.BAD_REQUEST });
  if (!("products" in req.body) || !Array.isArray(req.body.products))
    throw new AppError({ description: "products is invalid", httpCode: HTTPCodes.BAD_REQUEST });

  const products = req.body.products as NewAdInfo[];

  const ids = await Promise.all(
    products.map(async (product) => {
      return await AdHandler.postProduct(product);
    })
  );
  const itemIds = ids[0] as unknown as number[];

  const items = await Promise.all(itemIds.map((id) => connection("ads").select("*").where("id", id).first()));

  items.forEach((item: AdInfo | undefined) => {
    if (item) {
      marketplace.addAd(item);
    }
  });

  return res.json({
    data: {
      ids,
      products,
    },
  });
});

server.get("/testing/calculateScores", async (req, res) => {
  const marketplace = req.marketplace;
  if (!marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  marketplace.calculateScores();

  await marketplace.refresh();

  return res.render("home", {
    data: {
      products: marketplace.getAllAds(),
    },
  });
});

server.get("/testing/reset", async (req, res) => {
  const marketplace = req.marketplace;
  if (!marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  await marketplace.reset();
  await marketplace.setup();
  marketplace.start();
  const ads = marketplace.getAds("product");
  return res.render("home", {
    data: {
      products: ads,
    },
  });
});
server.get("/testing/purge", async (_, res) => {
  await connection.delete().from("ads");

  const newInstances: NewAdInfo[] = [
    { marketplaceId: 1, price: 2999, productId: 1 },
    { marketplaceId: 1, price: 40, productId: 2 },
    { marketplaceId: 1, price: 40, productId: 7 },
    { marketplaceId: 1, price: 80, productId: 11 },
    { marketplaceId: 1, price: 80, productId: 5 },
  ];

  await Promise.all(newInstances.map((ad) => AdHandler.postProduct(ad)));
  await Algo.setup();
  Algo.start();
  res.redirect("/testing/ads");
});
server.get("/testing/ads/:adId/logging", (req, res) => {
  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const logtype = logFactory.getLog("view");
  logtype.log("vie");

  res.status(200);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
  ErrorHandler.handle(err, res);
};

server.use(EFunction);

// setInterval(() => {
//   Algo.refresh();
// }, 1000);

server.listen(process.env.PORT, async () => {
  console.clear();
  await Algo.setup();
  Algo.start();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
