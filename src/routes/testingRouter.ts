import { Router } from "express";
import { Algo, SETTINGS_FLAGS, isSettingType } from "../Algo";
import { AppError, HTTPCodes } from "../ErrorHandler";
import { SERVER_URL } from "../constants";
import { LogTypes, isLogType, logFactory } from "../logging/LogTypes";
import { connection } from "../server";
import { NewAdInfo } from "../types/types";

export const testingRouter = Router();

testingRouter.get("/ads", (req, res) => {
  const data = req.marketplace?.getAllAds();
  res.render("home", { data: { products: data } });
});
testingRouter.post("/ads/new", async (req, res) => {
  const newAd: NewAdInfo = {
    adType: "product",
    productId: Number(req.body.productId),
    marketplaceId: Number(req.body.marketplaceId),
    price: Number(req.body.price),
  };
  const a = await fetch(`${SERVER_URL}/ads`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(newAd),
  });
  const jsona = await a.json();

  console.log(jsona);

  res.send({
    json: "asdf",
  });
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

  await Algo.setup();
  Algo.start();
  res.redirect("/testing/ads");
});

testingRouter.get("/ads/settings", (_, res) => {
  console.log(SETTINGS_FLAGS);
  res.render("partials/algoSettings", {
    flags: SETTINGS_FLAGS,
  });
});

testingRouter.put("/ads/settings", (req, res) => {
  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  const settingType = req.query["setting"] as string;

  const isSetting = isSettingType(settingType);
  if (typeof settingType !== "string" && !isSetting) {
    throw new AppError({
      description: "invalid Setting description",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  if (isSetting && typeof SETTINGS_FLAGS[settingType] === "boolean") {
    SETTINGS_FLAGS[settingType as keyof typeof SETTINGS_FLAGS] = !SETTINGS_FLAGS[
      settingType as keyof typeof SETTINGS_FLAGS
    ] as never;
  }

  res.render("partials/algoSettings", {
    algo: Algo,
  });
});

testingRouter.get("/ads/:adId/logging", (req, res) => {
  console.log("ahel");
  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const ad = req.marketplace.getAd(Number(req.params["adId"]));

  if (SETTINGS_FLAGS.countViews && "type" in req.query && isLogType(req.query.type as keyof typeof LogTypes)) {
    const logtype = logFactory.getLog(req.query.type as keyof typeof LogTypes);
    if (ad) {
      logtype.log(ad);
    }
  }

  res.status(200);
});
