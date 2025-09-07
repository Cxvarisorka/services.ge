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
    // const phoneCode = newUser.generatePhoneVerificationCode();

    await newUser.save({validateBeforeSave: false});

    const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${verificationTokenEmail}`;

    const htmlContent = `
        <div style="font-family: 'BPG Nino Mtavruli', Arial, sans-serif; background: #f7f7fa; padding: 40px 0;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 32px;">
                <div style="text-align: center;">
                    <img src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" alt="Email Verification" width="64" style="margin-bottom: 16px;" />
                    <h2 style="color: #2d2d6e; margin-bottom: 8px;">ელ. ფოსტის დადასტურება</h2>
                </div>
                <p style="color: #444; font-size: 16px; margin-bottom: 24px;">
                    გამარჯობა, <b>${newUser.name}</b>!<br>
                    გმადლობთ, რომ დარეგისტრირდით <b>Services.ge</b>-ზე.<br>
                    თქვენი ელ. ფოსტის დადასტურება აუცილებელია, რათა შეძლოთ ყველა ფუნქციის გამოყენება.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${verificationURL}" style="display: inline-block; background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%); color: #fff; text-decoration: none; font-size: 18px; padding: 14px 32px; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(108, 99, 255, 0.12); transition: background 0.2s;">
                        ელ. ფოსტის დადასტურება
                    </a>
                </div>
                <p style="color: #888; font-size: 14px; margin-bottom: 0;">
                    თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული ბრაუზერში:<br>
                    <span style="word-break: break-all; color: #2d2d6e;">${verificationURL}</span>
                </p>
                <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #eee;">
                <div style="text-align: center; color: #bbb; font-size: 13px;">
                    <span>საუკეთესო სურვილებით,<br>services.ge გუნდი</span>
                </div>
            </div>
        </div>
    `;
    // Send email verification
    sendEmail({
        to: email,
        subject: "Email Verification",
        htmlContent
    })

    // 4. Send phone verification SMS
    // try {
    //     await vonage.sms.send({
    //         to: phone,
    //         from: "Services.ge",
    //         text: `Your Services.ge verification code is: ${phoneCode}`,
    //     });
    // } catch (err) {
    //     console.error("Vonage SMS Error:", err);
    //     return res.status(500).json({ status: "fail", message: "SMS ვერ გაიგზავნა" });
    // }

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
    // if(!user.isEmailVerified || !user.isPhoneVerified){
    //     return next(new AppError("გთხოვთ დაადასტუროთ email და ტელეფონის ნომერი", 400));
    // }

    if(!user.isEmailVerified){
        return next(new AppError("გთხოვთ დაადასტუროთ email და ტელეფონის ნომერი", 400));
    }


    // Send JWT token and user data in response
    createSendToken(user, 200, res);
});

/**
 * Email Verification Controller
 * 
 * Verifies a user's email address using a token sent to their email. If the token is valid and not expired,
 * the user's email is marked as verified.
 * 
 * @route GET /api/v1/users/verify-email/:token
 * @access Public
 * 
 * @param {Object} req - Express request object, containing the verification token in params
 * @param {Object} res - Express response object
 */
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

/**
 * Phone Verification Controller
 * 
 * Verifies a user's phone number using a code sent via SMS. If the code is valid and not expired,
 * the user's phone is marked as verified.
 * 
 * @route POST /api/v1/users/verify-phone
 * @access Public
 * 
 * @param {Object} req - Express request object, containing phone and code in body
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
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

/**
 * Role-based Access Restriction Middleware
 * 
 * Restricts access to certain routes based on user roles. Only users whose role is included in the allowed roles
 * can proceed; others receive a 403 Forbidden error.
 * 
 * @param {...string} roles - Allowed user roles (e.g., 'admin', 'user')
 * @returns {Function} Express middleware function
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'user']. role='user'
        if(!roles.includes(req.user.role)) {
            return next(new AppError('თქვენ არ გაქვთ უფლება ამ მოქმედების გამოყენების!', 403));
        }

        next();
    }
};

/**
 * User Verification Check Middleware
 * 
 * Checks if the authenticated user has verified their email (and optionally phone).
 * If not verified, responds with a 403 error; otherwise, proceeds to the next middleware.
 * 
 * @param {Object} req - Express request object (expects req.user to be populated)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
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

/**
 * Forgot Password Controller
 * 
 * Handles password reset requests. Generates a password reset token for the user and sends it via email.
 * The token is valid for a limited time and allows the user to reset their password.
 * 
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 * 
 * @param {Object} req - Express request object, containing the user's email in body
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('თქვენი შემოყვანილი ელფოსტით მომხმარებელი ვერ მოიძებნა!', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it back as email
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    const message = `დაგავიწყდათ პაროლი? გააგზავნეთ PATCH მოთხოვნა ახალი პაროლით და passwordConfirm-ით შემდეგ ბმულზე: ${resetURL}.\nთუ თქვენ არ დაგვიწყებიათ პაროლი, შეგიძლიათ უგულებელყოთ ეს წერილი!`;

    // Beautiful HTML content in Georgian
    const htmlContent = `
        <div style="font-family: 'BPG Nino Mtavruli', Arial, sans-serif; background: #f7f7fa; padding: 40px 0;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 32px;">
                <div style="text-align: center;">
                    <img src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" alt="Password Reset" width="64" style="margin-bottom: 16px;" />
                    <h2 style="color: #2d2d6e; margin-bottom: 8px;">პაროლის აღდგენა</h2>
                </div>
                <p style="color: #444; font-size: 16px; margin-bottom: 24px;">
                    გამარჯობა,<br>
                    მივიღეთ მოთხოვნა თქვენი პაროლის აღსადგენად.<br>
                    თუ თქვენ არ დაგვიწყებიათ პაროლი, შეგიძლიათ უგულებელყოთ ეს წერილი.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${resetURL}" style="display: inline-block; background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%); color: #fff; text-decoration: none; font-size: 18px; padding: 14px 32px; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(108, 99, 255, 0.12); transition: background 0.2s;">
                        პაროლის აღდგენა
                    </a>
                </div>
                <p style="color: #888; font-size: 14px; margin-bottom: 0;">
                    ბმული მოქმედებს 10 წუთის განმავლობაში.<br>
                    თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული ბრაუზერში:<br>
                    <span style="word-break: break-all; color: #2d2d6e;">${resetURL}</span>
                </p>
                <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #eee;">
                <div style="text-align: center; color: #bbb; font-size: 13px;">
                    <span>საუკეთესო სურვილებით,<br>services.ge გუნდი</span>
                </div>
            </div>
        </div>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: 'თქვენი პაროლის აღდგენის კოდი (მოქმედებს 10 წუთი)',
            message,
            htmlContent
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        console.error(err);
        return next(new AppError('ელფოსტის გაგზავნისას მოხდა შეცდომა. გთხოვთ, სცადეთ მოგვიანებით!', 500));
    }

    res.status(200).json({
        status: 'success',
        message: 'ტოკენი გაიგზავნა ელფოსტაზე!'
    });
});

/**
 * Password Reset Controller
 * 
 * Resets the user's password using a valid reset token. If the token is valid and not expired,
 * updates the user's password and logs them in by sending a new JWT token.
 * 
 * @route PATCH /api/v1/auth/reset-password/:token
 * @access Public
 * 
 * @param {Object} req - Express request object, containing the reset token in params and new password in body
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const { password, passwordConfirm } = req.body;

    console.log(req.params.token)

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gte: Date.now() } });

    console.log(user)

    // 2) If token has not expired and there is a user, set the new password

    if(!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Log the user in, send JWT
    createSendToken(user, 200, res);
});

/**
 * Update Password Controller
 * 
 * Allows an authenticated user to update their password by providing the current password and a new password.
 * If the current password is correct, updates the password and logs the user in with a new JWT token.
 * 
 * @route PATCH /api/v1/auth/update-password
 * @access Private
 * 
 * @param {Object} req - Express request object, containing currentPassword, newPassword, and passwordConfirm in body
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
});
 

// Export authentication controller functions
module.exports = { signup, login, verifyEmail, verifyPhone, restrictTo, checkVerified, forgotPassword, resetPassword, updatePassword };