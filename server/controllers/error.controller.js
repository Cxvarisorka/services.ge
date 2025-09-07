/**
 * Global Error Handling Controller
 * 
 * This module provides centralized error handling for the application.
 * It includes different error response formats for development and production environments.
 * 
 * @author Luka Tskhvaradze
 * @version 1.0.0
 */

/**
 * Send detailed error response for development environment
 * Includes full error object and stack trace for debugging
 * 
 * @param {Error} err - The error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

/**
 * Send sanitized error response for production environment
 * Only includes essential error information for security
 * 
 * @param {Error} err - The error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
}

/**
 * Global error handling middleware
 * 
 * This middleware catches all errors in the application and sends
 * appropriate responses based on the environment (development/production).
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
    // Set default status code and status if not already set
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // Send different error responses based on environment
    if (process.env.NODE_ENV === "dev") {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
}

module.exports = globalErrorHandler;