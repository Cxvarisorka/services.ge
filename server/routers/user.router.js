/**
 * User Router
 * 
 * This module defines the user-related authentication routes for the application.
 * It handles user registration (signup) and login endpoints, delegating logic to the authentication controller.
 * 
 * @module routers/user.router
 * @author Luka Tskhvaradze
 * @version 1.0.0
 */

const express = require("express");

// Import authentication controller functions for user registration and login
const { signup, login, verifyEmail, checkVerified, verifyPhone } = require("../controllers/auth.controller");

// Create a new Express router instance for user-related routes
const userRouter = express.Router();

/**
 * @route   POST /signup
 * @desc    Register a new user
 * @access  Public
 */
userRouter.post("/signup", signup);

/**
 * @route   POST /login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
userRouter.post("/login", login);

userRouter.get("/verify-email/:token", verifyEmail);
userRouter.get("/verify-phone", verifyPhone);

// Export the configured user router for use in the main application
module.exports = userRouter;