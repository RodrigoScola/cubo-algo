import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { Algo } from "./Algo";
import { AppError, ErrorHandler, HTTPCodes } from "./ErrorHandler";
import { __DEV__ } from "./constants";
import { AdInfo, NewAdInfo } from "./types/types";

const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
};
export const connection = Kcon(config);
const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.use(["/ads", "/testing"], (req, _, next) => {
  let marketplaceId = req.headers["marketplace"] || req.query["marketplace"] || req.body["marketplace"];

  if (__DEV__) {
    marketplaceId = "wecode";
  }

  if (!marketplaceId || typeof marketplaceId !== "string") {
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
  const data = req.marketplace?.getAds();
  res.send({
    data: data,
  });
});
server.get("/testing/ads", (req, res) => {
  const data = req.marketplace?.getAds();

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
      return await marketplace.postProduct(product);
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
  marketplace.sortScores();

  const [ads] = await Promise.all([marketplace.getAds(), marketplace.saveScores()]);

  return res.render("home", {
    data: {
      products: ads,
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
  const ads = marketplace.getAds();
  return res.render("home", {
    data: {
      products: ads,
    },
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
  ErrorHandler.handle(err, res);
};

server.use(EFunction);

setInterval(() => {
  Algo.refresh();
}, 1000);

server.listen(process.env.PORT, async () => {
  console.clear();
  await Algo.setup();
  Algo.start();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
