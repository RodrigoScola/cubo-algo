require("dotenv").config();

export const PORT = process.env.PORT || 5001;
export const __DEV__ = process.env.NODE_ENV === "development";

export const DATABASE_URL = process.env.DATABASE_URL || "";

export const SERVER_URL = __DEV__ ? "http://localhost:5000" : "https://cubo-backend.onrender.com";

export const ROTATION_ADS = 3;