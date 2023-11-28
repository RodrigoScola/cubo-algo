import express, { ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import { Algo } from "./Algo";
import { ErrorHandler } from "./ErrorHandler";

import cors from "cors";
import { __DEV__ } from "./constants";
import { appRouter } from "./routes/routes";

const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
  pool: {
    min: 0,
    max: 10,
  },
};
export const connection = Kcon(config);

export const server = express();
server.use(
  cors({
    origin: "*",
  })
);

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.use("/", appRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
  ErrorHandler.handle(err, res);
};

server.use(EFunction);

const REFRESH_INTERVAL = __DEV__ ? 1000 * 10 : 1000 * 60 * 30;
setInterval(() => {
  console.log("refreshing");
  Algo.refresh();
}, REFRESH_INTERVAL);

server.listen(process.env.PORT, async () => {
  // await Promise.all([connection("ads").where("id", ">", 0).del()]);

  console.clear();
  await Algo.setup();
  Algo.start();
  await Algo.refresh();
  console.log(`SERVER WORKING ON PORT ${process.env.PORT}`);
});
