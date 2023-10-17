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
const Adhandler_1 = require("../Adhandler");
const Algo_1 = require("../Algo");
const ErrorHandler_1 = require("../ErrorHandler");
const LogTypes_1 = require("../logging/LogTypes");
const server_1 = require("../server");
exports.testingRouter = (0, express_1.Router)();
exports.testingRouter.get("/ads", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAllAds();
    res.render("home", { data: { products: data } });
});
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
    const ads = marketplace.getAds("product");
    return res.render("home", {
        data: {
            products: ads,
        },
    });
}));
exports.testingRouter.get("/purge", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield server_1.connection.delete().from("ads");
    const newInstances = [
        { marketplaceId: 1, price: 2999, productId: 1, adType: "product" },
        { marketplaceId: 1, price: 40, productId: 2, adType: "product" },
        { marketplaceId: 1, price: 40, productId: 7, adType: "product" },
        { marketplaceId: 1, price: 80, productId: 11, adType: "product" },
        { marketplaceId: 1, price: 80, productId: 5, adType: "product" },
    ];
    yield Promise.all(newInstances.map((ad) => Adhandler_1.AdHandler.postProduct(ad)));
    yield Algo_1.Algo.setup();
    Algo_1.Algo.start();
    res.redirect("/testing/ads");
}));
exports.testingRouter.get("/ads/settings", (_, res) => {
    console.log(Algo_1.SETTINGS_FLAGS);
    res.render("partials/algoSettings", {
        algo: Algo_1.Algo,
    });
});
function isSettingType(settingName) {
    return Object.keys(Algo_1.SETTINGS_FLAGS).includes(settingName);
}
exports.testingRouter.put("/ads/settings", (req, res) => {
    if (!req.marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const settingType = req.query["setting"];
    if (typeof settingType !== "string" && !isSettingType(settingType)) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Setting description",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    if (isSettingType(settingType)) {
        const isBoolean = typeof Algo_1.SETTINGS_FLAGS[settingType] === "boolean";
        if (isBoolean) {
            Algo_1.SETTINGS_FLAGS[settingType] = !Algo_1.SETTINGS_FLAGS[settingType];
        }
    }
    res.render("partials/algoSettings", {
        algo: Algo_1.Algo,
    });
});
exports.testingRouter.get("/ads/:adId/logging", (req, res) => {
    if (!req.marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const ad = req.marketplace.getAd(Number(req.params["adId"]));
    if (Algo_1.SETTINGS_FLAGS.countViews && "type" in req.query && (0, LogTypes_1.isLogType)(req.query.type)) {
        const logtype = LogTypes_1.logFactory.getLog(req.query.type);
        if (ad) {
            logtype.log(ad);
        }
    }
    res.status(200);
});
