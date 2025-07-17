const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'user name required'],
            trim: true,
            minlength: [3, 'too short user name'],
            maxlength: [32, 'too long user name']
        },
        slug: {
            type: String,
            lowercase: true,
        },
        email: {
            type: String,
            required: [true, 'user email required'],
            unique: [true, 'email must be unique'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
        },
        password: {
            type: String,
            required: function () {
                // Only require password if not using social login
                return !this.googleId && !this.facebookId;
            },
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        isResetCodeVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ['user', 'manager', 'admin'],
            default: 'user',
        },
        image: {
            type: String,
            default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/users/profiles/default-user.png'
        },
        active: {
            type: Boolean,
            default: true
        },
        deactivatedAt: Date,
        authToken: {
            type: String,
        },
        phone: {
            type: String
        },
        balance: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it's modified (or new)
    if (!this.isModified('password') || !this.password) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Update passwordChangedAt property when password is changed
userSchema.pre('save', function (next) { // .save() and .create()
    if (!this.isModified('password') || this.isNew) return next();

    // Set passwordChangedAt to current time minus 1 second
    // This ensures the token is created after the password has been changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
});


// Query middleware: Only find active users by default
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    // Only exclude inactive users if not explicitly querying for them
    if (!this._conditions.hasOwnProperty('active')) {
        this.find({ active: { $ne: false } });
    }
    next();
});

// Instance method to check if password is correct
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if user changed password after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

// Create model
const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
