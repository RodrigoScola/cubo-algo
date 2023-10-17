import { Router } from "express";
import { AdHandler } from "../Adhandler";
import { Algo, SETTINGS_FLAGS } from "../Algo";
import { AppError, HTTPCodes } from "../ErrorHandler";
import { logFactory } from "../logging/LogTypes";
import { connection } from "../server";
import { NewAdInfo } from "../types/types";

export const testingRouter = Router();

testingRouter.get("/ads", (req, res) => {
  const data = req.marketplace?.getAllAds();
  res.render("home", { data: { products: data } });
});

testingRouter.get("/calculateScores", async (req, res) => {
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

testingRouter.get("/reset", async (req, res) => {
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

testingRouter.get("/purge", async (_, res) => {
  await connection.delete().from("ads");

  const newInstances: NewAdInfo[] = [
    { marketplaceId: 1, price: 2999, productId: 1, adType: "product" },
    { marketplaceId: 1, price: 40, productId: 2, adType: "product" },
    { marketplaceId: 1, price: 40, productId: 7, adType: "product" },
    { marketplaceId: 1, price: 80, productId: 11, adType: "product" },
    { marketplaceId: 1, price: 80, productId: 5, adType: "product" },
  ];

  await Promise.all(newInstances.map((ad) => AdHandler.postProduct(ad)));
  await Algo.setup();
  Algo.start();
  res.redirect("/testing/ads");
});

testingRouter.get("/ads/settings", (_, res) => {
  console.log(SETTINGS_FLAGS);
  res.render("partials/algoSettings", {
    algo: Algo,
  });
});
testingRouter.put("/ads/settings", (req, res) => {
  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  const settingType = req.query["setting"];

  SETTINGS_FLAGS[settingType] = !SETTINGS_FLAGS[settingType as keyof typeof SETTINGS_FLAGS];

  res.render("partials/algoSettings", {
    algo: Algo,
  });
});

testingRouter.get("/ads/:adId/logging", (req, res) => {
  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const ad = req.marketplace.getAd(Number(req.params["adId"]));

  if (SETTINGS_FLAGS.countViews) {
    const logtype = logFactory.getLog(req.query.type);
    logtype.log(ad);
  }

  res.status(200);
});
