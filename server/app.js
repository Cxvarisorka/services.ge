/**
 * Main Express Application Configuration
 * 
 * This file sets up the core Express application with middleware and error handling.
 * It serves as the central configuration point for the services.ge application.
 * 
 * @author Services.ge Development Team
 * @version 1.0.0
 * @since 2024
 */

// 3rd Party modules
const express = require("express");
const morgan = require("morgan");

// Error handling
const globalErrorHandler = require("./controllers/error.controller.js");

// Routers
const userRouter = require("./routers/user.router");
const serviceRouter = require("./routers/service.router.js");
const cookieParser = require("cookie-parser");

// Initialize Express application instance
const app = express();

// Loggin request in dev env
if(process.env.NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

// Global middlewares
// To parse cookies
app.use(cookieParser());

// To parse request body
app.use(express.json());

// Middleware routers
app.use("/api/v1/users", userRouter);
app.use("/api/v1/services", serviceRouter);

// Global error handling middleware
// This middleware catches all unhandled errors and provides consistent error responses
app.use(globalErrorHandler);

// Export the configured Express app for use in server.js
module.exports = app;

