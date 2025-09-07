/**
 * @file service.controller.js
 * @description Controller functions for managing Service resources (CRUD operations).
 * Provides endpoints for listing, retrieving, creating, updating, and deleting services.
 * All responses follow a consistent JSON structure.
 */

const Service = require("../models/service.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * @desc    Retrieve all services
 * @route   GET /api/v1/services
 * @access  Public
 */
const getServices = catchAsync(async (req, res, next) => {
    const services = await Service.find();

    res.status(200).json({
        status: "success",
        results: services.length,
        data: {
            services
        }
    });
});

/**
 * @desc    Retrieve a single service by ID
 * @route   GET /api/v1/services/:id
 * @access  Public
 */
const getService = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID format
    if (!id || id.length !== 24) {
        return next(new AppError("არასწორი სერვისის ID!", 400));
    }

    const service = await Service.findById(id);

    if (!service) {
        return next(new AppError("ვერ მოიძებნა სერვისი!", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            service
        }
    });
});

/**
 * @desc    Create a new service
 * @route   POST /api/v1/services
 * @access  Protected (provider only)
 */
const addService = catchAsync(async (req, res, next) => {
    // Extract fields from request body
    const { title, description, price, tags, images } = req.body;

    // Optionally, get providerID from authenticated user (if using auth middleware)
    // const providerID = req.user._id;
    const providerID = req.user._id; // fallback if not using auth

    if (!providerID) {
        return next(new AppError("სერვისის დამატება შეუძლებელია: პროვაიდერი არ არის მითითებული!", 400));
    }

    // Create new service document
    const newService = await Service.create({
        providerID,
        title,
        description,
        price,
        tags,
        images
    });

    res.status(201).json({
        status: "success",
        data: {
            service: newService
        }
    });
});

/**
 * @desc    Update an existing service by ID
 * @route   PATCH /api/v1/services/:id
 * @access  Protected (provider only)
 */
const updateService = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID format
    if (!id || id.length !== 24) {
        return next(new AppError("არასწორი სერვისის ID!", 400));
    }

    // Only allow updatable fields
    const allowedFields = ["title", "description", "price", "tags", "images"];
    const updates = {};
    for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }

    const updatedService = await Service.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    });

    if (!updatedService) {
        return next(new AppError("ვერ მოიძებნა სერვისი განახლებისთვის!", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            service: updatedService
        }
    });
});

/**
 * @desc    Delete a service by ID
 * @route   DELETE /api/v1/services/:id
 * @access  Protected (provider only)
 */
const deleteService = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID format
    if (!id || id.length !== 24) {
        return next(new AppError("არასწორი სერვისის ID!", 400));
    }

    // Find the service by ID
    const service = await Service.findById(id);

    if (!service) {
        return next(new AppError("ვერ მოიძებნა სერვისი წასაშლელად!", 404));
    }

    // Check if the current user is the provider of the service
    if (service.providerID.toString() !== req.user._id.toString()) {
        return next(new AppError("თქვენ არ გაქვთ უფლება ამ სერვისის წაშლის!", 403));
    }

    await Service.findByIdAndDelete(id);

    res.status(204).json({
        status: "success",
        data: null
    });
});

// Export controller functions for use in routes
module.exports = {
    getServices,
    getService,
    addService,
    updateService,
    deleteService
};