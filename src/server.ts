import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { Algo } from "./Algo";
import { AppError, ErrorHandler, HTTPCodes } from "./ErrorHandler";
import { __DEV__ } from "./constants";
import { testingRouter } from "./routes/testingRouter";

import cors from "cors";

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
server.use(
  cors({
    origin: "*",
  })
);

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.use(["/ads", "/testing"], async (req, _, next) => {
  let marketplaceName = req.headers["marketplace"];

  if (__DEV__) {
    marketplaceName = "wecode";
  }

  const { id } = await connection
    .select("id")
    .from("marketplaces")
    .where("name", marketplaceName as string)
    .first();

  const marketplace = Algo.getMarketPlace(id);
  if (!marketplace) {
    throw new AppError({
      description: `Marketplace ${id} not found`,
      httpCode: HTTPCodes.NOT_FOUND,
    });
  }
  req.marketplace = marketplace;
  next();
});

server.use("/testing", testingRouter);

server.get("/ads", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send({
    data: data,
  });
});
server.get("/ads/products", (req, res) => {
  const data = req.marketplace?.getAds();
  res.send({
    data: data,
  });
});

server.get("/ping", (req, res) => {
  res.send("pong");
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
  ErrorHandler.handle(err, res);
};

server.use(EFunction);

setInterval(() => {
  Algo.refresh();
}, 15000);

server.listen(process.env.PORT, async () => {
  console.clear();
  await Algo.setup();
  Algo.start();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
