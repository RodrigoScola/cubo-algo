"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adsInteractionsRouter = void 0;
const express_1 = require("express");
const BackendApi_1 = require("../../BackendApi");
const ErrorHandler_1 = require("../../ErrorHandler");
exports.adsInteractionsRouter = (0, express_1.Router)({
    mergeParams: true,
});
exports.adsInteractionsRouter.put("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, count } = req.query;
    const numberCount = Number(count);
    if (!type || !numberCount) {
        let returnMessage = "";
        if (!type)
            returnMessage = "type";
        if (!type && !numberCount)
            returnMessage += " and ";
        if (!count)
            returnMessage = "count";
        throw new ErrorHandler_1.AppError({
            description: `Missing ${returnMessage} query param`,
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    if (type !== "views" && type !== "clicks") {
        throw new ErrorHandler_1.AppError({
            description: "Invalid Query Param",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    if (!req.marketplace || !("adId" in req.params)) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const ad = req.marketplace.getAd(Number(req.params.adId));
    if (!ad) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Ad Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const updated = yield new BackendApi_1.BackendApi().update(`/ads/${ad.info.id}/interactions`, {
        [type]: numberCount,
    });
    console.log({
        updated,
    });
    if (!ad.context || !updated)
        return;
    if ("views" in updated)
        ad.context.views = updated.views;
    if ("ctr" in updated)
        ad.context.ctr = updated.ctr;
    if ("clicks" in updated)
        ad.context.clicks = updated.clicks;
    res.render("partials/product", {
        product: ad,
    });
}));
exports.adsInteractionsRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clicks, views } = req.body;
    const numberClicks = Number(clicks);
    const numberViews = Number(views);
    if (!("adId" in req.params)) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Ad Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    if (!numberClicks || !numberViews) {
        throw new ErrorHandler_1.AppError({
            description: "Invalid Body",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const updatedAdInteraction = yield new BackendApi_1.BackendApi().post(`/ads/${req.params.adId}/interactions`, {
        clicks: numberClicks,
        views: numberViews,
    });
    console.log({
        updatedAdInteraction,
    });
    res.sendStatus(400);
}));
