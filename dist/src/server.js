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
const Algo_1 = require("./Algo");
const ErrorHandler_1 = require("./ErrorHandler");
const constants_1 = require("./constants");
const testingRouter_1 = require("./routes/testingRouter");
const cors_1 = __importDefault(require("cors"));
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
server.use((0, cors_1.default)({
    origin: "*",
}));
server.use(express_1.default.json());
server.use(express_1.default.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");
server.use(["/ads", "/testing"], (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    const marketplaceName = req.headers["marketplace"];
    if (constants_1.__DEV__) {
        console.log("dev");
    }
    console.log(marketplaceName);
    const { id } = yield exports.connection
        .select("id")
        .from("marketplaces")
        .where("name", marketplaceName)
        .first();
    const marketplace = Algo_1.Algo.getMarketPlace(id);
    if (!marketplace) {
        throw new ErrorHandler_1.AppError({
            description: `Marketplace ${id} not found`,
            httpCode: ErrorHandler_1.HTTPCodes.NOT_FOUND,
        });
    }
    req.marketplace = marketplace;
    next();
}));
server.use("/testing", testingRouter_1.testingRouter);
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction = (err, __, res, _next) => {
    ErrorHandler_1.ErrorHandler.handle(err, res);
};
server.use(EFunction);
setInterval(() => {
    Algo_1.Algo.refresh();
}, 1000);
server.listen(process.env.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.clear();
    yield Algo_1.Algo.setup();
    Algo_1.Algo.start();
    console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
}));
