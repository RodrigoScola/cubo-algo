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
exports.testingRouter = void 0;
const express_1 = require("express");
const Algo_1 = require("../Algo");
const BackendApi_1 = require("../BackendApi");
const ErrorHandler_1 = require("../ErrorHandler");
const server_1 = require("../server");
exports.testingRouter = (0, express_1.Router)();
exports.testingRouter.get("/ads", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAllAds();
    res.render("home", { data: { products: data } });
});
exports.testingRouter.post("/ads/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newAdInfo = {
        adType: "product",
        productId: Number(req.body.productId),
        marketplaceId: Number(req.body.marketplaceId),
        price: Number(req.body.price),
    };
    const newAd = yield new BackendApi_1.BackendApi().post("/ads", newAdInfo);
    if (newAd) {
        const marketplace = Algo_1.Algo.getMarketPlace(newAd.marketplaceId);
        console.log(`🚀 ~ file: testingRouter.ts:32 ~ testingRouter.post ~ marketplace:`, marketplace);
        marketplace === null || marketplace === void 0 ? void 0 : marketplace.addAd(newAd);
    }
    res.send(newAd);
}));
exports.testingRouter.get("/calculateScores", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const marketplace = req.marketplace;
    if (!marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    marketplace.calculateScores();
    yield marketplace.refresh();
    return res.render("home", {
        data: {
            products: marketplace.getAllAds(),
        },
    });
}));
exports.testingRouter.get("/reset", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const marketplace = req.marketplace;
    if (!marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    yield marketplace.reset();
    yield marketplace.setup();
    marketplace.start();
    const ads = marketplace.getAds();
    return res.render("home", {
        data: {
            products: ads,
        },
    });
}));
exports.testingRouter.get("/purge", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([server_1.connection.delete().from("ads"), server_1.connection.delete().from("interactions")]);
    yield Algo_1.Algo.setup();
    Algo_1.Algo.start();
    res.redirect("/testing/ads");
}));
exports.testingRouter.get("/ads/settings", (_, res) => {
    res.render("partials/algoSettings", {
        flags: Algo_1.SETTINGS_FLAGS,
    });
});
exports.testingRouter.put("/ads/settings", (req, res) => {
    if (!req.marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const settingType = req.query["setting"];
    const isSetting = (0, Algo_1.isSettingType)(settingType);
    if (typeof settingType !== "string" && !isSetting) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Setting description",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    if (isSetting && typeof Algo_1.SETTINGS_FLAGS[settingType] === "boolean") {
        Algo_1.SETTINGS_FLAGS[settingType] = !Algo_1.SETTINGS_FLAGS[settingType];
    }
    res.render("partials/algoSettings", {
        algo: Algo_1.Algo,
    });
});
