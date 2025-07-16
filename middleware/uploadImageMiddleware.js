const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ApiError = require("../utils/apiError");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Memory storage for image upload
const multerStorage = multer.memoryStorage();

// Filter for image files only
const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new ApiError('Only Images allowed', 400), false);
    }
};

// Configure multer
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware for multiple images upload for products
exports.uploadProductImages = (req, res, next) => {
    // Define the fields for product images
    const uploadFields = [
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 5 }
    ];
    
    // Apply the upload middleware
    upload.fields(uploadFields)(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(new ApiError('Too many files uploaded', 400));
                }
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError('File too large (max: 5MB)', 400));
                }
            }
            return next(err);
        }
        
        console.log('Files received:', req.files);
        next();
    });
};

// Upload buffer to Cloudinary
const uploadToCloudinary = async (buffer, folder = 'products') => {
    try {
        // Convert buffer to base64 string
        const base64String = buffer.toString('base64');
        const dataURI = `data:image/jpeg;base64,${base64String}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: folder,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto:good'
        });
        
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new ApiError('Failed to upload image to cloud storage', 500);
    }
};

// Process product images
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
    console.log('Processing product images:', req.files);

    // Skip if no files uploaded
    if (!req.files) {
        return next();
    }

    // 1. Process imageCover
    if (req.files.imageCover) {
        // Resize image
        const processedImageBuffer = await sharp(req.files.imageCover[0].buffer)
            .toFormat('jpeg')
            .jpeg({ quality: 100 })
            .toBuffer();
        
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(processedImageBuffer, 'products/covers');
        
        // Save image URL to req.body
        req.body.imageCover = imageUrl;
    }

    // 2. Process images array
    if (req.files.images) {
        req.body.images = [];

        // Process each image in parallel
        const uploadPromises = req.files.images.map(async (img, index) => {
            // Resize image
            const processedImageBuffer = await sharp(img.buffer)
                .toFormat('jpeg')
                .jpeg({ quality: 100 })
                .toBuffer();
            
            // Upload to Cloudinary
            const imageUrl = await uploadToCloudinary(processedImageBuffer, 'products/gallery');
            
            // Return the URL
            return imageUrl;
        });

        // Wait for all uploads to complete
        req.body.images = await Promise.all(uploadPromises);
    }

    next();
});

// User image upload middleware
exports.uploadUserImage = (req, res, next) => {
    // Single file upload for user profile image
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(new ApiError('Too many files uploaded', 400));
                }
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError('File too large (max: 5MB)', 400));
                }
            }
            return next(err);
        }
        
        console.log('User image received:', req.file);
        next();
    });
};

// Process user image
exports.resizeUserImage = asyncHandler(async (req, res, next) => {
    // Skip if no file uploaded
    if (!req.file) {
        return next();
    }

    // Process and resize user image
    const processedImageBuffer = await sharp(req.file.buffer)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer();
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(processedImageBuffer, 'users/profiles');
    
    // Save image URL to req.body
    req.body.image = imageUrl;
    
    next();
});

