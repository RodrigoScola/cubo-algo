"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adsRouter = void 0;
const express_1 = require("express");
const ErrorHandler_1 = require("../../ErrorHandler");
exports.adsRouter = (0, express_1.Router)();
exports.adsRouter.param('adId', (req, _, next, adId) => {
    var _a;
    const numberAdId = Number(adId);
    if (!numberAdId) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Ad Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const ad = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAd(numberAdId);
    if (!ad) {
        throw new ErrorHandler_1.NotFoundError("Ad not found");
    }
    req.ad = ad;
    next();
});
exports.adsRouter.get("/", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAds();
    res.send(data);
});
exports.adsRouter.get("/products", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAds();
    res.send(data);
});
