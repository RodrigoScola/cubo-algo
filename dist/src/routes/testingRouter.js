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
const types_1 = require("../types/types");
exports.testingRouter = (0, express_1.Router)();
exports.testingRouter.get("/ads", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAllAds();
    res.json(data);
});
exports.testingRouter.get("/ads/:adId", (req, res) => {
    var _a;
    const numberAdId = Number(req.params.adId);
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAllAds().find((x) => x.info.id === numberAdId);
    res.json(data);
});
exports.testingRouter.post("/ads/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newAd = {
        adType: "product",
        skuId: 0,
        status: types_1.PostStatus.ACTIVE,
        productId: Number(req.body.productId),
        marketplaceId: Number(req.body.marketplaceId),
        price: Number(req.body.price),
    };
    const jsona = yield new BackendApi_1.BackendApi().post("/ads", newAd);
    res.send(jsona);
}));
exports.testingRouter.get("/calculateScores", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("asdf");
    const marketplace = req.marketplace;
    if (!marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    marketplace.calculateScores();
    yield marketplace.setup();
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
    yield server_1.connection.delete().from("ads");
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
exports.testingRouter.put("/ads/", (req, res) => {
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
