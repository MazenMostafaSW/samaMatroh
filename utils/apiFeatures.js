class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    filter() {
        const queryStringObj = { ...this.queryString };
        const excludesFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
        excludesFields.forEach((field) => delete queryStringObj[field]);
        let queryStr = JSON.stringify(queryStringObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        const filterQuery = JSON.parse(queryStr);

        // Merge filter and search
        const finalQuery = { ...filterQuery, ...(this.searchQuery || {}) };
        if (this.queryString.keyword || Object.keys(filterQuery).length > 0) {
            console.log('Final query:', finalQuery);
        }
        this.mongooseQuery = this.mongooseQuery.find(finalQuery);

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else {
            // Sort by createdAt and _id for stable, unique order
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt -_id');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }
        return this;
    }

    search(modelName) {
        this.searchQuery = {};
        if (this.queryString.keyword) {
            console.log('search() called with modelName:', modelName, 'and keyword:', this.queryString.keyword);
            if (modelName === 'Product') {
                this.searchQuery = { $text: { $search: this.queryString.keyword } };
            } else {
                this.searchQuery = { name: { $regex: this.queryString.keyword, $options: 'i' } };
            }
            console.log('Search query built:', this.searchQuery);
        }
        return this;
    }

    paginate(countDocuments) {
        const page = Math.max(parseInt(this.queryString.page) || 1, 1);
        const limit = Math.max(parseInt(this.queryString.limit) || 50, 1);
        const skip = (page - 1) * limit;
        const endIndex = page * limit;

        // Pagination result
        const pagination = {};
        pagination.currentPage = page;
        pagination.limit = limit;
        pagination.numberOfPages = Math.ceil(countDocuments / limit);

        // next page
        if (endIndex < countDocuments) {
            pagination.next = page + 1;
        }
        if (skip > 0) {
            pagination.prev = page - 1;
        }
        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

        this.paginationResult = pagination;
        return this;
    }
}

module.exports = ApiFeatures;