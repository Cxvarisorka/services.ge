/**
 * @file Service Model
 * @description Defines the Mongoose schema for storing service-related data with tags support (letters, numbers, spaces allowed only).
 * @author Luka Tskhvaradze
 * @version 1.3.0
 * @created 2025-09-07
 */

const mongoose = require("mongoose");
const validator = require("validator");

/**
 * Service Schema
 * -----------------------
 * Represents services offered by users (providers). Each service has
 * a title, description, price, images, tags, ratings, and reviews.
 */
const serviceSchema = new mongoose.Schema(
    {
        /**
         * ID of the user who provides this service.
         * References the User model.
         */
        providerID: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: [true, "სერვისს სჭირდება პროვაიდერი!"],
        },

        /**
         * Title of the service.
         * Example: "Full-Stack Web Development"
         */
        title: {
            type: String,
            required: [true, "სერვისს სჭირდება სათაური!"],
            trim: true,
            minlength: [3, "სათაური უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს!"],
            maxlength: [100, "სათაური არ უნდა აღემატებოდეს 100 სიმბოლოს!"],
        },

        /**
         * Detailed description of the service.
         * Explains what the service includes and its benefits.
         */
        description: {
            type: String,
            required: [true, "სერვისს სჭირდება აღწერა!"],
            trim: true,
            minlength: [10, "აღწერა უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს!"],
            maxlength: [2000, "აღწერა არ უნდა აღემატებოდეს 2000 სიმბოლოს!"],
        },

        /**
         * Price of the service.
         * Must be a positive numeric value.
         */
        price: {
            type: Number,
            required: [true, "სერვისს სჭირდება ფასი!"],
            min: [0, "ფასი არ შეიძლება იყოს უარყოფითი!"],
            validate: {
                validator: (value) => validator.isNumeric(value.toString()),
                message: "ფასი უნდა იყოს რიცხვი!",
            },
        },

        /**
         * Tags related to the service.
         * Example: ["web development", "react js", "backend"]
         * Only letters, numbers, and spaces are allowed.
         */
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
                minlength: [2, "თეგი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს!"],
                maxlength: [30, "თეგი არ უნდა აღემატებოდეს 30 სიმბოლოს!"],
                validate: {
                    validator: (value) => /^[\p{L}\p{N} ]+$/u.test(value),
                    message: "თეგი უნდა შეიცავდეს მხოლოდ ასოებს, ციფრებს და სფეისს!",
                },
            },
        ],

        /**
         * Array of image URLs representing the service.
         * Must be valid URLs.
         */
        images: [
            {
                type: String,
                validate: {
                    validator: (value) => validator.isURL(value),
                    message: "სურათის ბმული არასწორია!",
                },
            },
        ],

        /**
         * Average rating for the service.
         * Calculated from reviews.
         * Range: 0 to 5.
         */
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },

        /**
         * Total number of reviews for this service.
         */
        totalReviews: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator: (value) => validator.isInt(value.toString(), { min: 0 }),
                message: "რევიუების რაოდენობა უნდა იყოს არანაკლებ 0!",
            },
        },

        reviews: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Review"
            }
        ]
    },
    {
        timestamps: true,
    }
);

// serviceSchema.pre('save', async function(next) {
//     if(!this.isModified('reviews')) return next();

//     this.totalReviews++;


// });

/**
 * Pre-save hook to ensure averageRating consistency.
 * If there are no reviews, rating resets to 0 automatically.
 */
serviceSchema.pre("save", function (next) {
    if (this.totalReviews === 0) {
        this.averageRating = 0;
    }
    next();
});

module.exports = mongoose.model("Service", serviceSchema);
