import { Router } from "express";

export const adsRouter = Router();

adsRouter.get("/", (req, res) => {
  const data = req.marketplace?.getAds();

  res.send({
    data: data,
  });
});

adsRouter.put("/", (_, res) => {
  res.send({
    a: "a",
  });
});
adsRouter.get("/products", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send({
    data: data,
  });
});
