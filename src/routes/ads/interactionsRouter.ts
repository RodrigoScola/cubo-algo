import { Router } from "express";
import { BackendApi } from "../../BackendApi";
import { AppError, HTTPCodes } from "../../ErrorHandler";
import { Interaction } from "../../types/types";

export const adsInteractionsRouter = Router();

adsInteractionsRouter.put("/ads/:adId/interactions", async (req, res) => {
  const { type, count } = req.query;

  if (!type || !count) {
    let returnMessage: string = "";
    if (!type) returnMessage = "type";
    if (!type && !count) returnMessage += " and ";
    if (!count) returnMessage = "count";
    throw new AppError({
      description: `Missing ${returnMessage} query param`,
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  if ((type !== "views" && type !== "clicks") || typeof count !== "number") {
    throw new AppError({
      description: "Invalid Query Param",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  if (!req.marketplace) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const ad = req.marketplace.getAd(Number(req.params["adId"]));

  if (ad) {
    const updated = await new BackendApi().update<Partial<Interaction>>(`/ads/${ad.info.id}/interactions`, {
      [type]: count,
    });
    if (!ad.context || !updated || !updated.data) return;
    if ("views" in updated.data) ad.context.views = updated.data.views;
    if ("ctr" in updated.data) ad.context.ctr = updated.data.ctr;
    if ("clicks" in updated.data) ad.context.clicks = updated.data.clicks;
  }
  res.status(200);
});
