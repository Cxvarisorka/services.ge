/**
 * Service Router
 * 
 * This module defines the routes for managing service resources (CRUD operations).
 * It provides endpoints for listing, retrieving, creating, updating, and deleting services.
 * Authentication middleware is applied to protected routes to ensure only authorized users can modify or delete services.
 * 
 * @module routers/service.router
 * @author Luka
 * @version 1.0.0
 */

const express = require("express");

// Import controller functions for service operations
const { 
    getServices, 
    addService, 
    getService, 
    updateService, 
    deleteService 
} = require("../controllers/service.controller");

// Import authentication middleware to protect sensitive routes
const protect = require("../middlewares/authMiddleware");
const { restrictTo } = require("../controllers/auth.controller");

// Create a new Express router instance for service-related routes
const serviceRouter = express.Router();

/**
 * @route   GET /api/v1/services
 * @desc    Retrieve all services
 * @access  Public
 * 
 * @route   POST /api/v1/services
 * @desc    Create a new service
 * @access  Protected (provider only)
 */
serviceRouter.route("/")
    .get(getServices)      // Public: List all services
    .post(protect, restrictTo("service_provider", "admin", "moderator"), addService);   // Protected: Add a new service (provider only)

/**
 * @route   GET /api/v1/services/:id
 * @desc    Retrieve a single service by ID
 * @access  Public
 * 
 * @route   PATCH /api/v1/services/:id
 * @desc    Update an existing service by ID
 * @access  Protected (provider only)
 * 
 * @route   DELETE /api/v1/services/:id
 * @desc    Delete a service by ID
 * @access  Protected (provider only)
 */
serviceRouter.route("/:id")
    .get(getService)                   // Public: Get service by ID
    .patch(protect, restrictTo("service_provider", "admin", "moderator"), updateService)     // Protected: Update service (provider only)
    .delete(protect,  restrictTo("service_provider", "admin", "moderator"), deleteService);   // Protected: Delete service (provider only)

// Export the configured service router for use in the main application
module.exports = serviceRouter;