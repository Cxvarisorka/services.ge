/**
 * Updates the average rating and total number of reviews for a given service.
 *
 * This helper function recalculates the average rating and total review count
 * for a service based on all associated reviews in the database. It uses MongoDB's
 * aggregation framework to compute the statistics, and then updates the corresponding
 * fields in the Service document.
 *
 * @async
 * @function updateServiceStats
 * @param {mongoose.Types.ObjectId | string} serviceId - The ID of the service to update.
 * @returns {Promise<void>} Resolves when the service stats have been updated.
 *
 * Usage:
 *   await updateServiceStats(serviceId);
 *
 * Notes:
 * - If there are no reviews for the service, the averageRating is set to 0 and totalReviews to 0.
 * - This function should be called after creating, updating, or deleting a review.
 */

const Review = require("../models/review.model.js");
const Service = require("../models/service.model.js");

const updateServiceStats = async (serviceId) => {
    // Aggregate reviews to calculate average rating and total number of reviews for the service
    const stats = await Review.aggregate([
        { $match: { serviceId } }, // Match reviews for the given service
        {
            $group: {
                _id: "$serviceId", // Group by service ID
                averageRating: { $avg: "$rating" }, // Calculate average rating
                totalReviews: { $sum: 1 } // Count total reviews
            }
        }
    ]);

    console.log(stats)
  
    if (stats.length > 0) {
        // If there are reviews, update the service with calculated stats
        await Service.findByIdAndUpdate(serviceId, {
            averageRating: stats[0].averageRating,
            totalReviews: stats[0].totalReviews
        });
    } else {
        // If no reviews exist, reset stats to zero
        await Service.findByIdAndUpdate(serviceId, {
            averageRating: 0,
            totalReviews: 0
        });
    }
};

module.exports = updateServiceStats;