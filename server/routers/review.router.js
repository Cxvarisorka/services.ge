/**
 * Review Router
 * 
 * This router handles review creation for services.
 * Only authenticated users can post a review.
 * 
 * @module routers/service.router
 * @author Luka
 * @version 1.0.0
 */

const express = require("express");
const { createReview, getReviewsByService, getReview, deleteReview } = require("../controllers/review.controller");
const protect = require("../middlewares/authMiddleware");

// Create a new Express router instance for review-related routes
const reviewRouter = express.Router();

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review for a service
 * @access  Protected (authenticated users only)
 */
reviewRouter.post("/", protect, createReview);


/**
 * @route GET /api/v1/reviews/service/:serviceId
 * @desc Get all reveiws for a service
 * @access Public
 */
reviewRouter.get("/service/:serviceId", getReviewsByService);

/**
 * @route GET /api/v1/reviews/:reviewId
 * @desc Get specific review 
 * @access Protected (authenticated users only)
 */
reviewRouter.get("/:reviewId", protect, getReview);

/**
 * @route DELETE /api/v1/reviews/:reviewId
 * @desc Delete specific review 
 * @access Protected (authenticated users only)
 */
reviewRouter.delete("/:reviewId", protect, deleteReview);

module.exports = reviewRouter;
