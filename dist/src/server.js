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
const cluster_1 = __importDefault(require("cluster"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const knex_1 = require("knex");
const os_1 = __importDefault(require("os"));
const Algo_1 = require("./Algo");
const ErrorHandler_1 = require("./ErrorHandler");
const constants_1 = require("./constants");
require("./process");
const router_1 = require("./routes/router");
const totalCPUs = os_1.default.availableParallelism();
Error.stackTraceLimit = Infinity;
const config = {
    client: "mysql2",
    connection: process.env.DATABASE_URL || "",
    pool: {
        min: 0,
        max: 10,
    },
};
exports.connection = (0, knex_1.knex)(config);
function createTables() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.connection.raw(`
    create table if not exists ads_rotation(
      id int primary key,
      inRotation boolean,
      canGetInRotation boolean,
      score int
    )
  `);
    });
}
if (cluster_1.default.isPrimary && !constants_1.__DEV__) {
    console.log(`Number of CPUs is ${totalCPUs}`);
    console.log(`Primary ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < totalCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on("exit", (worker) => {
        console.log(`worker ${worker.process.pid} died`);
        console.log("Let's fork another worker!");
        cluster_1.default.fork();
    });
}
else {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: "*" }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(express_1.default.json());
    app.use(express_1.default.static(__dirname + "/views/public"));
    app.use("/", router_1.appRouter);
    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");
    app.get("/", (_, res) => {
        res.send("hello world");
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const EFunction = (err, __, res, _next) => {
        ErrorHandler_1.ErrorHandler.handle(err, res);
    };
    app.use(EFunction);
    app.listen(constants_1.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
        console.clear();
        yield createTables();
        (0, Algo_1.run)();
        console.log(`Server is running in http://localhost:${constants_1.PORT}`);
    }));
}
const TIME_INTERVAL = constants_1.__DEV__ ? 10000 : 300000;
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    (0, router_1.clearMarketplace)();
    yield (0, Algo_1.run)();
    console.log('running');
}), TIME_INTERVAL);
