const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../../models/userModel');
const ApiError = require('../../utils/apiError');
const sendEmail = require('../../utils/sendEmail');
const { createToken } = require('./tokenService');

// Forgot password with email verification
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    // 1) Check if email exists
    if (!email) {
        return next(new ApiError('Please provide your email address', 400));
    }

    // 2) Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError('There is no user with this email address', 404));
    }

    // 3) Generate random reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000);
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(resetCode.toString())
        .digest('hex');

    // Save hashed reset code to db
    user.passwordResetToken = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: true });



    // Send email with reset code
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Password Reset Code (valid for 10 min)',
            message: `Verification code`, // You can remove or update this if not used in your sendEmail function
            html: `    <div>
        <img 
            src="https://res.cloudinary.com/dvow5shsk/image/upload/v1747844251/%D8%B9%D9%88%D9%88%D9%88_scpvia.png" 
            alt="Profile Photo" 
            style="width: 100px; border-radius: 50%;"
        >
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
            <h2 style="color: #2d3748; text-align: center;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #4a5568;">
                Hello,<br>
                You requested to reset your password.hf,Please use the verification code below:
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 32px; letter-spacing: 6px; color: #3182ce; font-weight: bold; background: #e6f7ff; padding: 12px 32px; border-radius: 6px;">
                ${resetCode}
                </span>
            </div>
            <p style="font-size: 15px; color: #718096;">
                This code will expire in <strong>10 minutes</strong>.<br>
                If you did not request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="font-size: 13px; color: #a0aec0; text-align: center;">
                &copy; ${new Date().getFullYear()} meng
            </p>
        </div>
        `
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({ validateBeforeSave: undefined });

        return next(new ApiError('There was an error sending the email. Try again later!', 500));
    }

    res.status(200).json({
        status: 'success',
        message: 'Reset code sent to your email'
    });

});


// Verify reset code
exports.verifyResetCode = asyncHandler(async (req, res, next) => {
    const { resetCode } = req.body;

    // Hash the reset code to compare with the stored hashed token
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(resetCode.toString())
        .digest('hex');

    // Find user with matching hashed reset code that hasn't expired
    const user = await User.findOne({
        passwordResetToken: hashedResetCode,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ApiError('Invalid or expired reset code', 400));
    }

    // Mark code as verified
    user.isResetCodeVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'Reset code is valid'
    });
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { resetCode, password } = req.body;

    // Hash the reset code
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(resetCode.toString())
        .digest('hex');

    // Find user with matching hashed reset code that hasn't expired and code is verified
    const user = await User.findOne({
        passwordResetToken: hashedResetCode,
        passwordResetExpires: { $gt: Date.now() },
        isResetCodeVerified: true
    });

    if (!user) {
        return next(new ApiError('Invalid or expired reset code', 400));
    }

    // Set new password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.isResetCodeVerified = undefined;
    await user.save({ validateBeforeSave: false });

    // Create token
    const token = createToken(user._id);

    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
        token
    });
});

