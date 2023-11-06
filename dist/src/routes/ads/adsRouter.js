"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adsRouter = void 0;
const express_1 = require("express");
exports.adsRouter = (0, express_1.Router)();
exports.adsRouter.get("/", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAds();
    res.send(data);
});
exports.adsRouter.put("/", (_, res) => {
    res.send({
        a: "a",
    });
});
exports.adsRouter.get("/products", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAds();
    res.send(data);
});
