/**
 * User Model Schema
 * 
 * This module defines the User schema for MongoDB using Mongoose.
 * It includes comprehensive validation for user registration and authentication.
 * 
 * @author Luka Tskhvaradze
 * @version 1.0.0
 */

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

/**
 * User Schema Definition
 * 
 * Defines the structure and validation rules for user documents in the database.
 * Includes fields for user identification, authentication, and profile information.
 */
const userSchema = new mongoose.Schema({
    // User's full name
    name: {
        type: String,
        required: [true, "მომხმარებლის სახელი აუცილებელია"]
    },
    
    // User's email address with validation
    email: {
        type: String,
        required: [true, "ელექტრონული ფოსტა აუცილებელია"],
        unique: true, // Ensures email uniqueness across all users
        lowercase: true, // Automatically converts to lowercase
        validate: [validator.isEmail, "გთხოვთ მიუთითოთ სწორი ელექტრონული ფოსტა"]
    },

    // User's email verification status
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    // Token for email verification (hashed)
    emailVerificationToken: String,
    // Expiry date for email verification token
    emailVerificationExpires: Date,

    // User's phone verification status
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    // Code sent to user for phone verification
    phoneVerificationCode: String,
    // Expiry date for phone verification code
    phoneVerificationExpires: Date,
    
    // User's password with strong validation requirements
    password: {
        type: String,
        required: [true, "პაროლი აუცილებელია"],
        minlength: [8, "პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან"],
        maxlength: [16, "პაროლი უნდა შედგებოდეს მაქსიმუმ 16 სიმბოლოსგან"],
        select: false, // Exclude password from queries by default for security
        validate: [validator.isStrongPassword, "პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან, მინიმუმ 1 ციფრი, 1 პატარა ასო, 1 დიდ ასო, 1 სპეციალური სიმბოლო."]
    },
    
    // Password confirmation field for registration validation
    passwordConfirm: {
        type: String,
        required: function() {
            // Only required on new documents (registration)
            return this.isNew;
        },
        validate: {
            // Custom validator to ensure password confirmation matches password
            validator: function(el) {
                return el === this.password;
            },
            message: "პაროლები არ ემთხვევა"
        }
    },

    // Date when the password was last changed
    passwordChangedAt: Date,
    // Token for password reset (hashed)
    passwordResetToken: String,
    // Expiry date for password reset token
    passwordResetExpires: Date,
    
    // User role for authorization and access control
    role: {
        type: String,
        enum: {
            values: ["costumer", "service_provider", "moderator", "admin"],
            message: "მომხმარებლის როლი უნდა იყოს: costumer, service_provider, moderator ან admin"
        },
        default: "costumer" // Default role for new users
    },
    
    // User's phone number with validation
    phone: {
        type: String,
        required: [true, "ტელეფონის ნომერი აუცილებელია"],
        validate: {
            validator: function(v) {
                // Validate Georgian phone number format
                return validator.isMobilePhone(v, 'ka-GE');
            },
            message: "მომხმარებლის ტელეფონის ნომერი უნდა იყოს სწორი და ქართული"
        },
        unique: true
    },
    
    // Optional profile image URL
    profileImage: {
        type: String,
        default: null
    }
}, {
    // Enable automatic timestamp fields (createdAt, updatedAt)
    timestamps: true,
    
    // Configure JSON output options
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Mongoose pre-save middleware to hash user passwords before saving to the database.
 * 
 * - Only runs if the password field has been modified (e.g., on user creation or password update).
 * - Uses bcrypt to securely hash the password with a cost factor of 12.
 * - Removes the passwordConfirm field before saving, as it is only needed for validation and should not be stored.
 *
 * @function
 * @param {Function} next - Callback to proceed to the next middleware
 */
userSchema.pre("save", async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) return next();

    // Hash the password with a cost factor of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Remove passwordConfirm field so it is not persisted in the database
    this.passwordConfirm = undefined;

    next();
});

/**
 * Mongoose pre-save middleware to set passwordChangedAt field.
 * 
 * - Only runs if the password has been modified and the document is not new.
 * - Sets passwordChangedAt to the current time minus 1 second to ensure the token is always created after this time.
 *
 * @function
 * @param {Function} next - Callback to proceed to the next middleware
 */
userSchema.pre('save', async function(next) {
    // If password is not modified or document is new, skip
    if(!this.isModified('password') || this.isNew) return next();

    // Set passwordChangedAt to current time minus 1 second
    this.passwordChangedAt = Date.now() - 1000; 

    next();
});

/**
 * Instance method to compare a candidate password with the user's hashed password.
 * 
 * - Used for authentication during login.
 * - Leverages bcrypt's compare function to check if the provided password matches the stored hash.
 *
 * @async
 * @function
 * @param {string} candidatePassword - The plain text password to verify
 * @param {string} userPassword - The hashed password stored in the database
 * @returns {Promise<boolean>} - Returns true if passwords match, false otherwise
 */
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Instance method to create an email verification token.
 * 
 * - Generates a random token, hashes it, and sets the hashed value and expiry on the user document.
 * - Returns the plain token (to be sent to the user).
 *
 * @function
 * @returns {string} token - The plain email verification token
 */
userSchema.methods.createEmailVerification = function() {
    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash the token and set it on the user document
    this.emailVerificationToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // Set token expiry to 24 hours from now
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Return the plain token (to be sent to the user)
    return token;
};

/**
 * Instance method to generate a phone verification code.
 * 
 * - Generates a 6-digit code, sets it and its expiry on the user document.
 * - Returns the code (to be sent to the user).
 *
 * @function
 * @returns {string} code - The phone verification code
 */
userSchema.methods.generatePhoneVerificationCode = function () {
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Set code and expiry on the user document
    this.phoneVerificationCode = code;
    this.phoneVerificationExpires = Date.now() + 5 * 60 * 1000; // 5 min
    // Return the code (to be sent to the user)
    return code;
};

/**
 * Instance method to create a password reset token.
 * 
 * - Generates a random token, hashes it, and sets the hashed value and expiry on the user document.
 * - Returns the plain token (to be sent to the user).
 *
 * @function
 * @returns {string} resetToken - The plain password reset token
 */
userSchema.methods.createPasswordResetToken = function() {
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token and set it on the user document
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiry to 10 minutes from now
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Return the plain token (to be sent to the user)
    return resetToken;
};

// Create and export the User model
// This creates a Mongoose model named "User" using the userSchema defined above.
const User = mongoose.model("User", userSchema);

// Export the User model for use in other parts of the application
module.exports = User;