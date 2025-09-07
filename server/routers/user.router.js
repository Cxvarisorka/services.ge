/**
 * User Router
 * 
 * This module defines the user-related authentication routes for the application.
 * It handles user registration (signup), login, email/phone verification, password reset, and password update endpoints,
 * delegating logic to the authentication controller.
 * 
 * @module routers/user.router
 * @author Luka Tskhvaradze
 * @version 1.0.0
 */

const express = require("express");

// Import authentication controller functions for user registration, login, verification, and password management
const { 
    signup, 
    login, 
    verifyEmail, 
    checkVerified, 
    verifyPhone, 
    forgotPassword, 
    resetPassword, 
    updatePassword 
} = require("../controllers/auth.controller");

// Import middleware to protect routes that require authentication
const protect = require("../middlewares/authMiddleware");

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

/**
 * @route   GET /verify-email/:token
 * @desc    Verify user's email address using a token sent via email
 * @access  Public
 */
userRouter.get("/verify-email/:token", verifyEmail);

/**
 * @route   GET /verify-phone
 * @desc    Verify user's phone number using a code sent via SMS
 * @access  Public
 */
userRouter.get("/verify-phone", verifyPhone);

/**
 * @route   POST /forgotPassword
 * @desc    Initiate password reset process by sending a reset link to user's email
 * @access  Public
 */
userRouter.post('/forgotPassword', forgotPassword);

/**
 * @route   PATCH /resetPassword/:token
 * @desc    Reset user's password using a valid reset token
 * @access  Public
 */
userRouter.patch('/resetPassword/:token', resetPassword);

/**
 * @route   PATCH /updateMyPassword
 * @desc    Update the authenticated user's password
 * @access  Private (requires authentication)
 */
userRouter.patch('/updateMyPassword', protect, updatePassword);

// Export the configured user router for use in the main application
module.exports = userRouter;