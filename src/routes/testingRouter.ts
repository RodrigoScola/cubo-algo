import { Router } from "express";
import { Algo, SETTINGS_FLAGS, isSettingType } from "../Algo";
import { BackendApi } from "../BackendApi";
import { AppError, HTTPCodes } from "../ErrorHandler";
import { connection } from "../server";
import { AdInfo, NewAdInfo, PostStatus } from "../types/types";

export const testingRouter = Router();

testingRouter.get("/ads", (req, res) => {
  const data = req.marketplace?.getAllAds();
  res.render("home", { data: { products: data } });
});
testingRouter.post("/ads/new", async (req, res) => {
  const newAdInfo: NewAdInfo = {
    adType: "product",
    status: PostStatus.ACTIVE,
    productId: Number(req.body.productId),
    marketplaceId: Number(req.body.marketplaceId),
    price: Number(req.body.price),
  };

  const jsona = await new BackendApi().post<AdInfo>("/ads", newAdInfo);
  console.log(jsona);
  res.send(jsona);
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
  await Promise.all([connection.delete().from("ads"), connection.delete().from("interactions")]);

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

testingRouter.put("/ads/", (req, res) => {
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
