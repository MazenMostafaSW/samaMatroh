const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

// Make sure all models are imported at the top
// This ensures they're registered with Mongoose before any populate operations
require('../models');
require('../models');
require('../models');

exports.deleteOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findByIdAndDelete(id);

        if (!document) {
            return next(new ApiError(`No document for this id ${id}`, 404));
        }

        res.status(200).json({
            status: 'success',
            data: null,
            message: 'Document deleted successfully'
        });
    });

exports.updateOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });

        if (!document) {
            return next(
                new ApiError(`No document for this id ${req.params.id}`, 404)
            );
        }
        // Trigger "save" event when update document
        document.save();
        res.status(200).json({ data: document });
    });

exports.createOne = (Model) =>
    asyncHandler(async (req, res) => {
        const newDoc = await Model.create(req.body);
        res.status(201).json({ data: newDoc });
    });

exports.getOne = (Model, populationOpt) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        let query = Model.findById(id);

        if (populationOpt) {
            if (Array.isArray(populationOpt)) {
                populationOpt.forEach(opt => {
                    query = query.populate(opt);
                });
            } else {
                query = query.populate(populationOpt);
            }
        }

        const document = await query;

        !document? next(new ApiError(`No document for this id ${id}`, 404))
        : res.status(200).json({ data: responseDoc });
        
    });

exports.getAll = (Model) =>
    asyncHandler(async (req, res) => {
        let filter = {};
        if (req.filterObj) {
            filter = req.filterObj;
        }
        // Build query
        const documentsCounts = await Model.countDocuments();
        const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
            .search()   
            .filter()
            .sort()
            .limitFields()
            .paginate(documentsCounts);

        // Execute query
        const { mongooseQuery, paginationResult } = apiFeatures;
        const documents = await mongooseQuery;

        // console.log('Page:', req.query.page, 'IDs:', documents.map(d => d._id));

        res
            .status(200)
            .json({ results: documents.length, paginationResult, data: documents });
    });

