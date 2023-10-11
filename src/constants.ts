require("dotenv").config();

export const __DEV__ = process.env.NODE_ENV === "development";

export const DATABASE_URL = process.env.DATABASE_URL || "mysql://g8741qkaethxg2s7o7pr:pscale_pw_oryuHO0zkTD2ojqn4YBYUjGNbBXeqQwd2ILClaq7zjT@aws.connect.psdb.cloud/cube_database?ssl={"rejectUnauthorized":true}";

