const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Types.ObjectId,
        ref: "Service",
        required: [true, "სერვისის ID აუცილებელია!"]
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "მომხმარებლის ID აუცილებელია!"]
    },
    comment: {
        type: String,
        required: [true, "სერვისს სჭირდება აღწერა!"],
        trim: true,
        minlength: [10, "აღწერა უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს!"],
        maxlength: [2000, "აღწერა არ უნდა აღემატებოდეს 2000 სიმბოლოს!"],
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        required: [true, "ქულის დაწერა აუცილებელია!"]
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;