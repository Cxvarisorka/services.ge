/**
 * @file email.js
 * @description Utility module for sending emails using Nodemailer.
 * 
 * This module provides a single asynchronous function, `sendEmail`, which is used to send emails
 * via SMTP using the Nodemailer library. The function is designed to be reusable and configurable
 * through environment variables for SMTP credentials and server details.
 * 
 * @author Luka Tskhvaradze
 * @module utils/email
 */

const nodemailer = require('nodemailer');

/**
 * Sends an email using the provided options.
 *
 * @async
 * @function sendEmail
 * @param {Object} options - Email sending options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Subject line of the email.
 * @param {string} [options.htmlContent] - HTML content of the email body.
 * @param {string} [options.text] - Plain text content of the email body (optional).
 * @returns {Promise<void>} Resolves when the email is sent successfully.
 * @throws {Error} Throws if email sending fails.
 *
 * @example
 * await sendEmail({
 *   to: 'recipient@example.com',
 *   subject: 'Welcome!',
 *   htmlContent: '<h1>Hello World</h1>'
 * });
 */
const sendEmail = async (options) => {
    // Create a Nodemailer transporter using SMTP configuration from environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Define the email options
    const mailOptions = {
        from: 'Luka Tskhvaradze <example@lulini.ge>', // Sender address
        to: options.to,                               // Recipient address
        subject: options.subject,                     // Email subject
        html: options.htmlContent,                    // HTML body content
        text: options.text                            // Optional plain text body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;