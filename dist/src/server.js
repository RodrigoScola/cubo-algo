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
exports.server = exports.connection = void 0;
const express_1 = __importDefault(require("express"));
const knex_1 = require("knex");
const Algo_1 = require("./Algo");
const ErrorHandler_1 = require("./ErrorHandler");
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes/routes");
const config = {
    client: "mysql2",
    connection: process.env.DATABASE_URL || "",
    pool: {
        min: 0,
        max: 10,
    },
};
exports.connection = (0, knex_1.knex)(config);
exports.server = (0, express_1.default)();
exports.server.use((0, cors_1.default)({
    origin: "*",
}));
exports.server.use(express_1.default.json());
exports.server.use(express_1.default.urlencoded({ extended: true }));
exports.server.set("view engine", "ejs");
exports.server.set("views", __dirname + "/views");
exports.server.use("/", routes_1.appRouter);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction = (err, __, res, _next) => {
    ErrorHandler_1.ErrorHandler.handle(err, res);
};
exports.server.use(EFunction);
setInterval(() => {
    Algo_1.Algo.refresh();
}, 15000);
exports.server.listen(process.env.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.clear();
    yield Algo_1.Algo.setup();
    Algo_1.Algo.start();
    console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
}));
