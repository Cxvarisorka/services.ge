/**
 * Authentication Controller
 * 
 * Handles user signup and login logic, including JWT token generation and secure cookie management.
 * Provides endpoints for user registration and authentication, ensuring secure handling of credentials.
 * 
 * @author Luka Tskhvaradze
 * @module controllers/auth.controller
 * @version 1.0.0
 */

const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError"); // Ensure AppError is required for error handling
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const vonage = require("../configs/vonage");

/**
 * Generates a JWT token for a given user ID.
 * 
 * @param {string} id - The user's MongoDB ObjectId
 * @returns {string} - Signed JWT token
 */
const signToken = (id) => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};


/**
 * Creates a JWT token, sets it as an HTTP-only cookie, and sends the user data in the response.
 * 
 * @param {Object} user - The user document
 * @param {number} statusCode - HTTP status code for the response
 * @param {Object} res - Express response object
 */

const createSendToken = (user, statusCode, res) => {
    // Generate JWT token for the user
    const token = signToken(user._id);

    // Configure cookie options for security and expiration
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        secure: process.env.NODE_ENV === "prod", // Send cookie only over HTTPS in production
        httpOnly: true // Prevent client-side JS from accessing the cookie
    };

    // Set JWT as a cookie in the response
    res.cookie("token", token, cookieOptions);

    // Remove password from output for security
    user.password = undefined;

    // Send user data and status in the response
    res.status(statusCode).json({
        status: "success",
        data: { user }
    });
}

/**
 * User Signup Controller
 * 
 * Registers a new user with the provided credentials and sends a JWT token upon successful registration.
 * 
 * @route POST /api/v1/auth/signup
 * @access Public
 */

const signup = catchAsync(async (req, res) => {
    // Extract user registration fields from request body
    const { name, email, password, passwordConfirm, phone } = req.body;

    // Create new user in the database
    const newUser = await User.create({ name, email, password, passwordConfirm, phone });

    const verificationTokenEmail = newUser.createEmailVerification();
    const phoneCode = newUser.generatePhoneVerificationCode();

    await newUser.save({validateBeforeSave: false});

    const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${verificationTokenEmail}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ka">
            <head>
                <meta charset="UTF-8">
                <title>ელექტრონული ფოსტის დადასტურება</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f4f7;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #4f46e5;
                        color: white;
                        text-align: center;
                        padding: 30px 20px;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 30px 20px;
                        line-height: 1.6;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #4f46e5;
                        color: white !important;
                        text-decoration: none;
                        padding: 15px 25px;
                        border-radius: 6px;
                        font-weight: bold;
                        margin-top: 20px;
                    }
                    .fallback {
                        font-size: 12px;
                        color: #888;
                        margin-top: 20px;
                        word-break: break-all;
                    }
                    .footer {
                        background-color: #f4f4f7;
                        color: #999;
                        text-align: center;
                        font-size: 12px;
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        კეთილი იყოს თქვენი მობრძანება Services.ge-ზე
                    </div>
                    <div class="content">
                        <p>გამარჯობა ${newUser.name},</p>
                        <p>გმადლობთ, რომ დარეგისტრირდით <strong>Services.ge</strong>-ზე! თქვენი ელ. ფოსტის დადასტურება აუცილებელია, რათა შეძლოთ ყველა ფუნქციის გამოყენება.</p>
                        <p style="text-align: center;">
                            <a href="${verificationURL}" class="btn">დადასტურება</a>
                        </p>
                        <p>თუ ღილაკი არ მუშაობს, გთხოვთ, ჩაწეროთ ბმული თქვენს ბრაუზერში:</p>
                        <p class="fallback">${verificationURL}</p>
                        <p>გილოცავთ და გისურვებთ წარმატებებს! 🚀</p>
                    </div>
                    <div class="footer">
                        Services.ge • თქვენი სანდო სერვისების პლატფორმა<br>
                        &copy; ${new Date().getFullYear()} Services.ge. ყველა უფლება დაცულია.
                    </div>
                </div>
            </body>
        </html>
    `;
    // Send email verification
    sendEmail({
        to: email,
        subject: "Email Verification",
        htmlContent
    })

    // 4. Send phone verification SMS
    try {
        await vonage.sms.send({
            to: phone,
            from: "Services.ge",
            text: `Your Services.ge verification code is: ${phoneCode}`,
        });
    } catch (err) {
        console.error("Vonage SMS Error:", err);
        return res.status(500).json({ status: "fail", message: "SMS ვერ გაიგზავნა" });
    }

    // 5. Respond success
    res.status(200).json({
        status: "success",
        message: "რეგისტრაცია წარმატებით დასრულდა! Email-ზე გამოგზავნილია დამადასტურებელი ლინკი და ტელეფონზე — კოდი.",
    });
});

/**
 * User Login Controller
 * 
 * Authenticates a user with email and password, and sends a JWT token upon successful login.
 * 
 * @route POST /api/v1/auth/login
 * @access Public
 */

const login = catchAsync(async (req, res, next) => {
    // Extract login credentials from request body
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
        return next(new AppError("გთხოვთ მიუთითოთ ელექტრონული ფოსტა და პაროლი", 400));
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("მომხმარებლის მონაცემები არასწორია", 401));
    }

    // Check if user verified email
    if(!user.isEmailVerified || !user.isPhoneVerified){
        return next(new AppError("გთხოვთ დაადასტუროთ email და ტელეფონის ნომერი", 400));
    }

    // Send JWT token and user data in response
    createSendToken(user, 200, res);
});

const verifyEmail = catchAsync(async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).send("Token invalid or expired");

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    res.send("Email წარმატებით დადასტურდა!");
});

const verifyPhone = catchAsync(async (req, res, next) => {
    const { phone, code } = req.body;

    const user = await User.findOne({
        phone,
        phoneVerificationCode: code, 
        phoneVerificationExpires: { $gt: Date.now() }
    });

    if(!user) {
        return next(new AppError("კოდი არასწორია ან ვადა გაუვიდა!", 400));
    }

    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json("ტელეფონი წარმატებით დადასტურდა!");
})

const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'user']. role='user'
        if(!roles.includes(req.user.role)) {
            return next(new AppError('თქვენ არ გაქვთ უფლება ამ მოქმედების გამოყენების!', 403));
        }

        next();
    }
};

const checkVerified = (req, res, next) => {
    const user = req.user; // assuming user is already attached to req via auth middleware

    if (!user.isEmailVerified) {
        return res.status(403).json({
            status: "fail",
            message: "გთხოვთ დაადასტუროთ email!"
        });
    }

    // if (!user.isPhoneVerified) {
    //     return res.status(403).json({
    //         status: "fail",
    //         message: "გთხოვთ დაადასტუროთ ტელეფონი!"
    //     });
    // }

    next(); // User is verified, continue
};


// Export authentication controller functions
module.exports = { signup, login, verifyEmail, verifyPhone, restrictTo, checkVerified };