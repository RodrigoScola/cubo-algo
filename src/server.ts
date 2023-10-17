import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { Algo } from "./Algo";
import { AppError, ErrorHandler, HTTPCodes } from "./ErrorHandler";
import { __DEV__ } from "./constants";
import { testingRouter } from "./routes/testingRouter";

const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
  pool: {
    min: 0,
    max: 10,
  },
};
export const connection = Kcon(config);

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.use(["/ads", "/testing"], (req, _, next) => {
  let marketplaceId = req.headers["marketplace"] || req.query["marketplace"] || req.body["marketplace"];

  if (__DEV__) {
    marketplaceId = 1;
  }

  if (!marketplaceId || typeof marketplaceId !== "number") {
    throw new AppError({ description: "marketplace is invalid", httpCode: HTTPCodes.BAD_REQUEST });
  }
  const marketplace = Algo.getMarketPlace(marketplaceId);
  if (!marketplace) {
    throw new AppError({
      description: `Marketplace ${marketplaceId} not found`,
      httpCode: HTTPCodes.NOT_FOUND,
    });
  }
  req.marketplace = marketplace;
  next();
});

server.use("/testing", testingRouter);

server.get("/ads", (req, res) => {
  const data = req.marketplace?.getAds("product");
  res.send({
    data: data,
  });
});
server.get("/ads/products", (req, res) => {
  const data = req.marketplace?.getAds("product");
  res.send({
    data: data,
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
  ErrorHandler.handle(err, res);
};

server.use(EFunction);

setInterval(() => {
  Algo.refresh();
}, 1000);

server.listen(process.env.PORT, async () => {
  console.clear();
  await Algo.setup();
  Algo.start();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
