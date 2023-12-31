
import cluster from 'cluster';
import cors from "cors";
import express, { Application, ErrorRequestHandler, Request, Response } from "express";
import { knex as Kcon, Knex } from "knex";
import os from 'os';
import { run } from "./Algo";
import { ErrorHandler } from "./ErrorHandler";
import { PORT, __DEV__ } from "./constants";
import "./process";
import { appRouter, clearMarketplace } from "./routes/router";

const totalCPUs = os.availableParallelism();
Error.stackTraceLimit = Infinity;
const config: Knex.Config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL || "",
  pool: {
    min: 0,
    max: 10,
  },
};
export const connection = Kcon(config);

async function createTables() {
  await connection.raw(`
    create table if not exists ads_rotation(
      id int primary key,
      inRotation boolean,
      canGetInRotation boolean,
      score int
    )
  `);
}

if (cluster.isPrimary && !__DEV__) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker,) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });

} else {


  const app: Application = express();

  app.use(cors({ origin: "*" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(__dirname + "/views/public"));

  app.use("/", appRouter);

  app.set("view engine", "ejs");
  app.set("views", __dirname + "/views");

  app.get("/", (_, res) => {
    res.send("hello world");
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const EFunction: ErrorRequestHandler = (err: Error, __: Request, res: Response, _next) => {
    ErrorHandler.handle(err, res);
  };

  app.use(EFunction);



  app.listen(PORT, async () => {
    console.clear();
    await createTables();
    run();
    console.log(`Server is running in http://localhost:${PORT}`);
  });

}

enum TIME_INTERVALS {
  SECOND = 1000,
  MINUTE = 60 * SECOND,
}

const TIME_INTERVAL = __DEV__ ? TIME_INTERVALS.SECOND * 30 : TIME_INTERVALS.MINUTE * 5;

setInterval(async () => {
  clearMarketplace();
  await run();
  console.log('running');
}, TIME_INTERVAL);