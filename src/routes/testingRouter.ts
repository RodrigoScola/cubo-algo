import { Router } from "express";
import { Algo, SETTINGS_FLAGS, isSettingType } from "../Algo";
import { BackendApi } from "../BackendApi";
import { AppError, HTTPCodes } from "../ErrorHandler";
import { SERVER_URL } from "../constants";
import { LogTypes, isLogType } from "../logging/LogTypes";
import { connection } from "../server";
import { Interaction, NewAdInfo } from "../types/types";

export const testingRouter = Router();

testingRouter.get("/ads", (req, res) => {
  const data = req.marketplace?.getAllAds();
  console.log({
    a: req.marketplace?.productAds.map((c) => c.context?.views),
  });
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

  res.send({
    jsona,
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
  const ads = marketplace.getAds();
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

testingRouter.put("/ads/:adId/logging", async (req, res) => {
  console.log("ahel");
  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const ad = req.marketplace.getAd(Number(req.params["adId"]));

  if (SETTINGS_FLAGS.countViews && "type" in req.query && isLogType(req.query.type as keyof typeof LogTypes)) {
    if (ad) {
      const updated = await new BackendApi().update<Partial<Interaction>>(`/ads/${ad.info.id}/interactions`, {
        clicks: 3,
      });

      if (!ad.context || !updated || !updated.data) return;
      if ("views" in updated.data) ad.context.views = updated.data.views;
      if ("ctr" in updated.data) ad.context.ctr = updated.data.ctr;
      if ("clicks" in updated.data) ad.context.clicks = updated.data.clicks;
    }
  }

  res.status(200);
});
