import { Router } from "express";

export const adsRouter = Router();

adsRouter.get("/", (req, res) => {
  const data = req.marketplace?.getAds();

  res.send(data);
});

adsRouter.get("/products", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send(data);
});
