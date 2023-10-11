import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { Algo } from "./Algo";
import { AppError, ErrorHandler, HTTPCodes } from "./ErrorHandler";
import { AdInfo, NewAdInfo } from "./types/types";
require("dotenv").config();

const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
};
export const connection = Kcon(config);

const server = express();

server.use(express.json());

server.param("marketPlaceId", (req, res, next, marketplaceId) => {
  if (!Algo.getMarketPlace(marketplaceId)) {
    throw new AppError({
      description: `Marketplace ${marketplaceId} not found`,
      httpCode: HTTPCodes.NOT_FOUND,
    });
  }
  req.marketplace = Algo.getMarketPlace(marketplaceId);
  next();
});
server.get("/marketplace/:marketPlaceId", async (req, res) => {
  const data = await req.marketplace?.getAds();
  res.send({
    data: data,
  });
});
server.post("/marketplace/:marketPlaceId", async (req, res) => {
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

  const items = await Promise.all(ids[0].map((id: number) => connection("ads").select("*").where("id", id).first()));

  items.forEach((item: AdInfo) => {
    marketplace.addAd(item);
  });

  return res.json({
    data: {
      ids,
      products,
    },
  });
});
server.get("/calculateScores", (req, res) => {
  Algo.calculateScores();
  return res.json({
    message: "done",
  });
});
server.get("/reset", (_, res) => {
  Algo.reset();
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
  await Algo.setup();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
