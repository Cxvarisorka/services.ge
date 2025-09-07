/**
 * @fileoverview Express Global Error Handling Middleware
 * @description Centralized error handling for operational and programming errors in both development and production environments.
 * @author Luka Tskhvaradze
 */

const AppError = require("../utils/appError.js");

/**
 * Formats Mongoose CastError (e.g., invalid ObjectId or type)
 * @param {Object} err - Mongoose error object
 * @returns {AppError} - Formatted application error for invalid data type
 */
const handleCastErrorDB = (err) => {
    const message = `არასწორი მონაცემი ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

/**
 * Formats MongoDB duplicate field error (error code 11000)
 * @param {Object} err - MongoDB error object
 * @returns {AppError} - Formatted application error for duplicate fields
 */
const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `ველის "${field}" მნიშვნელობა "${value}" უკვე გამოიყენება. გთხოვთ, გამოიყენეთ სხვა მნიშვნელობა.`;
    return new AppError(message, 400);
};

/**
 * Formats Mongoose ValidationError (schema validation failure)
 * @param {Object} err - Mongoose error object
 * @returns {AppError} - Formatted application error for validation issues
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `არასწორი მონაცემები. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

/**
 * Formats error for invalid JWT token
 * @returns {AppError} - JWT-specific application error
 */
const handleJWTError = () => {
    return new AppError('არასწორი ტოკენი. გთხოვთ, შედით თავიდან!', 401);
};

/**
 * Formats error for expired JWT token
 * @returns {AppError} - JWT expiration application error
 */
const handleJWTExpiredError = () => {
    return new AppError('თქვენი ტოკენის მოქმედების ვადა ამოიწურა. გთხოვთ, შედით თავიდან!', 401);
};

/**
 * Sends detailed error information in development environment
 * @param {Object} err - Error object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};

/**
 * Sends user-friendly error information in production environment
 * @param {Object} err - Error object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send safe message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming or unknown error: log internally and send generic message
        // console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'შეცდომა',
            message: 'რამე არასწორად მოხდა',
        });
    }
};

/**
 * Express Global Error Handling Middleware
 * Handles all errors in the application and formats responses based on environment.
 *
 * @function globalErrorHandler
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const globalErrorHandler = (err, req, res, next) => {
    // Set default status code and status
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'შეცდომა';

    if (process.env.NODE_ENV === 'dev') {
        // In development, send full error details
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'prod') {
        // In production, format known errors and send safe messages
        let error = { ...err };
        error.name = err.name;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = globalErrorHandler;
