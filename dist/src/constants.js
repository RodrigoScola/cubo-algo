"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_URL = exports.__DEV__ = void 0;
require("dotenv").config();
exports.__DEV__ = process.env.NODE_ENV === "development";
exports.DATABASE_URL = process.env.DATABASE_URL || "";
