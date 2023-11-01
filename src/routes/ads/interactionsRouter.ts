import { Router } from "express";
import { BackendApi } from "../../BackendApi";
import { AppError, HTTPCodes } from "../../ErrorHandler";
import { Interaction } from "../../types/types";

export const adsInteractionsRouter = Router({
  mergeParams: true,
});

adsInteractionsRouter.put("/", async (req, res) => {
  const { type, count } = req.query;
  const numberCount = Number(count);

  if (!type || !numberCount) {
    let returnMessage: string = "";
    if (!type) returnMessage = "type";
    if (!type && !numberCount) returnMessage += " and ";
    if (!count) returnMessage = "count";
    throw new AppError({
      description: `Missing ${returnMessage} query param`,
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  if (type !== "views" && type !== "clicks") {
    throw new AppError({
      description: "Invalid Query Param",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  if (!req.marketplace || !("adId" in req.params)) {
    throw new AppError({
      description: "invalid Marketplace Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }
  const ad = req.marketplace.getAd(Number(req.params.adId));

  if (!ad) {
    throw new AppError({
      description: "invalid Ad Id",
      httpCode: HTTPCodes.BAD_REQUEST,
    });
  }

  const updated = await new BackendApi().update<Partial<Interaction>>(`/ads/${ad.info.id}/interactions`, {
    [type]: numberCount,
  });

  console.log({
    updated,
  });

  if (!ad.context || !updated) return;
  if ("views" in updated) ad.context.views = updated.views;
  if ("ctr" in updated) ad.context.ctr = updated.ctr;
  if ("clicks" in updated) ad.context.clicks = updated.clicks;

  res.render("partials/product", {
    product: ad,
  });
});
