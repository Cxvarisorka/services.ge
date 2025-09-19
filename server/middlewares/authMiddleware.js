/**
 * @file authMiddleware.js
 * @description Middleware for protecting routes using JWT stored in cookies.
 * @author Luka
 * @version 1.0.0
 */

const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js"); // Update path if needed
const AppError = require("../utils/appError.js");

/**
 * Protect middleware to secure routes.
 * Checks JWT from cookies, verifies it, and attaches user to req.user.
 */
const protect = async (req, res, next) => {
    try {
        // 1. Check if token exists in cookies
        const token = req.cookies?.token;

        if (!token) {
            return next(new AppError("თქვენ არ ხართ ავტორიზირებული!", 401));
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        if (!decoded || !decoded.id) {
            return next(new AppError("არასწორი ტოკენი!", 401));
        }

        // 3. Find user by ID and exclude sensitive fields
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(new AppError("მომხმარებელი არ არსებობს!", 404));
        }

        // 4. Attach user to request object
        req.user = user;

        // 5. Move to next middleware or controller
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        // Handle token expiration separately
        if (error.name === "TokenExpiredError") {
            return next(new AppError("თქვენი ავტორიზაციის დრო ამოიწურა, გთხოთ გაიაროთ თავიდან!", 401));
        }

        return next(new AppError("თქვენ არ ხართ ავტორიზირებული!", 401));
    }
};

module.exports = protect;
