/**
 * Custom Application Error Class
 * 
 * This class extends the native Error class to create operational errors
 * that are expected and can be handled gracefully by the application.
 * 
 * @class AppError
 * @extends Error
 * 
 * @param {string} message - Error message to display to the user
 * @param {number} statusCode - HTTP status code for the error response
 * 
 * @example
 * // Create a 404 error
 * throw new AppError('User not found', 404);
 * 
 * // Create a 400 error
 * throw new AppError('Invalid email format', 400);
 * 
 * @author Luka Tskhvaradze
 * @version 1.0.0
 */
class AppError extends Error {
    constructor(message, statusCode) {
        // Call the parent Error constructor
        super(message);
        
        // Set HTTP status code
        this.statusCode = statusCode;
        
        // Determine error status based on status code
        // 4xx errors are client errors (fail), 5xx are server errors (error)
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        
        // Mark as operational error (expected, can be handled)
        this.isOperational = true;

        // Capture the stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
