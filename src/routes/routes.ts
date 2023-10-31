import { Router } from "express";
import { Algo } from "../Algo";
import { NOT_FOUND_ERROR } from "../ErrorHandler";
import { __DEV__ } from "../constants";
import { connection } from "../server";
import { adsRouter } from "./ads/adsRouter";
import { adsInteractionsRouter } from "./ads/interactionsRouter";
import { testingRouter } from "./testingRouter";

export const appRouter = Router();

appRouter.use(["/ads", "/testing"], async (req, _, next) => {
  let marketplaceName = req.headers["marketplace"];

  if (__DEV__) {
    marketplaceName = "wecode";
  }

  const { id } = await connection
    .select("id")
    .from("marketplaces")
    .where("name", marketplaceName as string)
    .first();

  const marketplace = Algo.getMarketPlace(id);
  if (!marketplace) {
    throw new NOT_FOUND_ERROR({ description: `Marketplace ${id} not found` });
  }
  req.marketplace = marketplace;
  next();
});
appRouter.use("/testing", testingRouter);
appRouter.use("/ads", adsRouter);
adsRouter.use("/:adId/interactions", adsInteractionsRouter);