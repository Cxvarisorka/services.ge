/**
 * Async Error Handler Utility
 * 
 * This utility function wraps async route handlers to automatically catch
 * and forward any errors to the Express error handling middleware.
 * 
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function that handles async errors
 * 
 * @example
 * // Instead of manually handling try/catch in every route:
 * const getUsers = catchAsync(async (req, res, next) => {
 *   const users = await User.find();
 *   res.status(200).json({ status: 'success', data: { users } });
 * });
 * 
 * @author Luka Tskhvaradze
 * @version 1.0.0
 */
module.exports = fn => {
    return (req, res, next) => {
        // Execute the async function and catch any errors
        // If an error occurs, it will be passed to the next error handler
        fn(req, res, next).catch(next);
    }
}