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
exports.appRouter = void 0;
const express_1 = require("express");
const Algo_1 = require("../Algo");
const ErrorHandler_1 = require("../ErrorHandler");
const constants_1 = require("../constants");
const server_1 = require("../server");
const adsRouter_1 = require("./ads/adsRouter");
const interactionsRouter_1 = require("./ads/interactionsRouter");
const testingRouter_1 = require("./testingRouter");
exports.appRouter = (0, express_1.Router)();
exports.appRouter.use(["/ads", "/testing"], (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!('marketplace' in req.headers)) {
        throw new ErrorHandler_1.BadRequestError('Marketplace header not set');
    }
    let marketplaceName = req.headers["marketplace"];
    if (constants_1.__DEV__) {
        marketplaceName = "wecode";
    }
    const { id } = yield server_1.connection
        .select("id")
        .from("marketplaces")
        .where("name", marketplaceName)
        .first();
    const marketplace = Algo_1.Algo.getMarketPlace(id);
    if (!marketplace) {
        throw new ErrorHandler_1.NotFoundError('Marketplace not found');
    }
    req.marketplace = marketplace;
    next();
}));
exports.appRouter.use("/testing", testingRouter_1.testingRouter);
exports.appRouter.use("/ads", adsRouter_1.adsRouter);
adsRouter_1.adsRouter.use("/:adId/interactions", interactionsRouter_1.adsInteractionsRouter);
