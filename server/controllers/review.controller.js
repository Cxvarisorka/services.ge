const updateServiceStats = require("../helpers/updateServiceStats");
const Review = require("../models/review.model");
const Service = require("../models/service.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const createReview = catchAsync(async (req, res, next) => {
    const { serviceId, rating, comment } = req.body;

    // Check if service exsist
    const service = await Service.findById(serviceId);
    if(!service){
        return next(new AppError("სერვისის მოძიება ვერ მოხეხრდა!", 404));
    }

    // Chekc if user already reviewd this service
    const exsistingReview = await Review.findOne({userId: req.user._id, serviceId});
    if(exsistingReview) {
        return next(new AppError("სერვისზე შეფასება უკვე გაკეთებული გაქვთ!", 400));
    }

    // Create review
    const review = await Review.create({
        serviceId,
        userId: req.user._id,
        rating, 
        comment
    });

    // Add new ID in reviews arr
    await Service.findByIdAndUpdate(
        serviceId,
        { $push: { reviews: review._id } },
        { new: true }
    );
  

    await updateServiceStats(service._id);

    res.status(201).json({
        status: "success",
        data: review
    });
});

const getReviewsByService = catchAsync(async (req, res, next) => {
    const { serviceId } = req.params;

    if (!serviceId) {
        return next(new AppError("სერვისის ID აუცილებელია და უნდა იყოს სწორი ფორმატით შეფასებების სანახავად!", 400));
    }

    // Check if the service exists
    const service = await Service.findById(serviceId);
    if (!service) {
        return next(new AppError("სერვისი ვერ მოიძებნა!", 404));
    }

    const reviews = await Review.find({ serviceId });

    res.status(200).json({
        status: "success",
        results: reviews.length,
        data: {
            reviews
        }
    });
});

const getReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;

    if (!reviewId) {
        return next(new AppError("შეფასების ID აუცილებელია და უნდა იყოს სწორი ფორმატით!", 400));
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        return next(new AppError("შეფასება ვერ მოიძებნა!", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            review
        }
    });
});

const deleteReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    if (!reviewId) {
        return next(new AppError("შეფასების ID აუცილებელია და უნდა იყოს სწორი ფორმატით!", 400));
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
        return next(new AppError("შეფასება ვერ მოიძებნა!", 404));
    }

    // Only the user who created the review can delete it
    if (review.userId.toString() !== req.user._id.toString()) {
        return next(new AppError("თქვენ არ გაქვთ ამ შეფასების წაშლის უფლება!", 403));
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(204).json({
        status: "success",
        data: null
    });
});

module.exports = { createReview, getReviewsByService, getReview, deleteReview };