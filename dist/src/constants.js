"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROTATION_ADS = exports.SERVER_URL = exports.DATABASE_URL = exports.__DEV__ = exports.PORT = void 0;
require("dotenv").config();
exports.PORT = process.env.PORT || 5001;
exports.__DEV__ = process.env.NODE_ENV === "development";
exports.DATABASE_URL = process.env.DATABASE_URL || "";
exports.SERVER_URL = exports.__DEV__ ? "http://localhost:5000" : "https://cubo-backend.onrender.com";
exports.ROTATION_ADS = 3;
