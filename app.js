// var express = require("express");
// var path = require("path");
// var cookieParser = require("cookie-parser");
// var logger = require("morgan");
// import connectDB from "./configuration/db";
// var indexRouter = require("./routes/index");
// var usersRouter = require("./routes/users");

import authRouter from "./routes/auth.js";
import centralSystemRoute from "./routes/centralSystem.js";
import chargePointRoute from "./routes/chargePointRoute.js";
import companyRoute from "./routes/company.js";
import connectDB from "./configuration/db.js";
import consumptionRoute from "./routes/consumption.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import locationRoute from "./routes/location.js";
import logger from "morgan";
import notificationRoute from "./routes/notification.js";
import path from "path";
import paymentRoute from "./routes/payment.js";
import reportRoute from "./routes/report.js";
import sendRemoteRequest from "./service/ocpp/sendRemoteRequest.js";
import swaggerSpec from "./configuration/swagger.js";
import swaggerUi from "swagger-ui-express";
import tariffRoute from "./routes/tariff.js";
import transactionRoute from "./routes/transaction.js";
// import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js"; //

// Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS: allow frontend origin(s); use FRONTEND_URL in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use("/", indexRouter);
app.use("/users", usersRouter); //
// app.use("/api", apiRouter);
app.use("/api/auth", authRouter);
app.use("/api/charge-points", chargePointRoute);
app.use("/api/transactions", transactionRoute);
app.use("/api/companies", companyRoute);
app.use("/api/locations", locationRoute);
app.use("/api/tariff", tariffRoute);
app.use("/api/consumption", consumptionRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/central-system/charge-points/:chargePointId", centralSystemRoute);
app.use("/api/ocpp", sendRemoteRequest);
app.use("/api/reports", reportRoute);

// Swagger API documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

export default app;
