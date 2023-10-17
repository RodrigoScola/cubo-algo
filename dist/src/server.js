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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const express_1 = __importDefault(require("express"));
const knex_1 = require("knex");
const Adhandler_1 = require("./Adhandler");
const Algo_1 = require("./Algo");
const ErrorHandler_1 = require("./ErrorHandler");
const constants_1 = require("./constants");
const LogTypes_1 = require("./logging/LogTypes");
const config = {
    client: "mysql2",
    connection: process.env.DATABASE_URL || "",
    pool: {
        min: 0,
        max: 10,
    },
};
exports.connection = (0, knex_1.knex)(config);
const server = (0, express_1.default)();
server.use(express_1.default.json());
server.use(express_1.default.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");
server.use(["/ads", "/testing"], (req, _, next) => {
    let marketplaceId = Number(req.headers["marketplace"] || req.query["marketplace"] || req.body["marketplace"]);
    if (constants_1.__DEV__) {
        marketplaceId = 1;
    }
    if (!marketplaceId || typeof marketplaceId !== "number") {
        throw new ErrorHandler_1.AppError({ description: "marketplace is invalid", httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST });
    }
    const marketplace = Algo_1.Algo.getMarketPlace(marketplaceId);
    if (!marketplace) {
        throw new ErrorHandler_1.AppError({
            description: `Marketplace ${marketplaceId} not found`,
            httpCode: ErrorHandler_1.HTTPCodes.NOT_FOUND,
        });
    }
    req.marketplace = marketplace;
    next();
});
server.get("/ads", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAds("product");
    res.send({
        data: data,
    });
});
server.get("/ads/products", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAds("product");
    res.send({
        data: data,
    });
});
server.get("/testing/ads", (req, res) => {
    var _a;
    const data = (_a = req.marketplace) === null || _a === void 0 ? void 0 : _a.getAllAds();
    res.render("home", { data: { products: data } });
});
server.post("/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const marketplace = req.marketplace;
    if (!marketplace)
        throw new ErrorHandler_1.AppError({ description: "marketplace is required", httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST });
    if (!("products" in req.body) || !Array.isArray(req.body.products))
        throw new ErrorHandler_1.AppError({ description: "products is invalid", httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST });
    const products = req.body.products;
    const ids = yield Promise.all(products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        return yield Adhandler_1.AdHandler.postProduct(product);
    })));
    const itemIds = ids[0];
    const items = yield Promise.all(itemIds.map((id) => (0, exports.connection)("ads").select("*").where("id", id).first()));
    items.forEach((item) => {
        if (item) {
            marketplace.addAd(item);
        }
    });
    return res.json({
        data: {
            ids,
            products,
        },
    });
}));
server.get("/testing/calculateScores", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
server.get("/testing/reset", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
server.get("/testing/purge", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.connection.delete().from("ads");
    const newInstances = [
        { marketplaceId: 1, price: 2999, productId: 1 },
        { marketplaceId: 1, price: 40, productId: 2 },
        { marketplaceId: 1, price: 40, productId: 7 },
        { marketplaceId: 1, price: 80, productId: 11 },
        { marketplaceId: 1, price: 80, productId: 5 },
    ];
    yield Promise.all(newInstances.map((ad) => Adhandler_1.AdHandler.postProduct(ad)));
    yield Algo_1.Algo.setup();
    Algo_1.Algo.start();
    res.redirect("/testing/ads");
}));
server.get("/testing/ads/:adId/logging", (req, res) => {
    if (!req.marketplace) {
        throw new ErrorHandler_1.AppError({
            description: "invalid Marketplace Id",
            httpCode: ErrorHandler_1.HTTPCodes.BAD_REQUEST,
        });
    }
    const logtype = LogTypes_1.logFactory.getLog("view");
    logtype.log("vie");
    res.status(200);
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction = (err, __, res, _next) => {
    ErrorHandler_1.ErrorHandler.handle(err, res);
};
server.use(EFunction);
// setInterval(() => {
//   Algo.refresh();
// }, 1000);
server.listen(process.env.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.clear();
    yield Algo_1.Algo.setup();
    Algo_1.Algo.start();
    console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
}));
