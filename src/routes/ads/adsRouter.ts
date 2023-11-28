import { Router } from "express";
import { AppError, HTTPCodes, NotFoundError } from "../../ErrorHandler";

export const adsRouter = Router();

adsRouter.param('adId', (req, _, next, adId) => {
  const numberAdId = Number(adId);

  if (!numberAdId) {
    throw new AppError({
      description: "invalid Ad Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  const ad = req.marketplace?.getAd(numberAdId);
  if (!ad) {
    throw new NotFoundError("Ad not found");
  }

  req.ad = ad;

  next();

});

adsRouter.get("/", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send(data);
});

adsRouter.get("/products", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send(data);
});
