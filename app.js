// var express = require("express");
// var path = require("path");
// var cookieParser = require("cookie-parser");
// var logger = require("morgan");
// import connectDB from "./configuration/db";
// var indexRouter = require("./routes/index");
// var usersRouter = require("./routes/users");

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import logger from "morgan";
import connectDB from "./configuration/db.js";
// import indexRouter from "./routes/index.js";
// import usersRouter from "./routes/users.js";
import chargePointRoute from "./routes/chargePointRoute.js";

// Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use("/", indexRouter);
// app.use("/users", usersRouter);
// app.use("/api", apiRouter);
app.use("/api/charge-points", chargePointRoute);

export default app;
