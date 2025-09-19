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

// Built-in modules
const path = require("path");

// Error handling
const globalErrorHandler = require("./controllers/error.controller.js");

// Routers
const userRouter = require("./routers/user.router");
const serviceRouter = require("./routers/service.router.js");
const cookieParser = require("cookie-parser");
const reviewRouter = require("./routers/review.router.js");

// Initialize Express application instance
const app = express();

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Static file serving
app.get('/reset-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', "pages", "reset-password.html"));
});

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
app.use("/api/v1/reviews", reviewRouter);

// Global error handling middleware
// This middleware catches all unhandled errors and provides consistent error responses
app.use(globalErrorHandler);

// Export the configured Express app for use in server.js
module.exports = app;

