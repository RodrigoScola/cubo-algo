import { Router } from "express";

export const adsRouter = Router();

adsRouter.get("/ads", (req, res) => {
  const data = req.marketplace?.getAds();

  res.send({
    data: data,
  });
});
adsRouter.get("/ads/products", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send({
    data: data,
  });
});
