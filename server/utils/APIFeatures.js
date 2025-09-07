/**
 * @fileoverview APIFeatures Utility Class
 * @description Provides advanced query features for MongoDB (Mongoose) such as filtering, sorting, field limiting, and pagination.
 *              Also supports filtering by tags (array property) for service selection.
 * @author
 */

class APIFeatures {
    /**
     * @param {Object} query - Mongoose query object
     * @param {Object} queryString - Express req.query object (parsed query string)
     */
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    /**
     * Applies filtering to the query based on query string parameters.
     * Supports MongoDB comparison operators (gte, gt, lte, lt) and
     * tag-based filtering (for array field 'tags').
     * @returns {APIFeatures} - Returns this for chaining
     */
    filter() {
        // Destructure reserved query params, keep the rest as filters
        const { page, sort, limit, fields, tags, ...filters } = this.queryString;
        const mongoQuery = {};

        // Handle advanced filtering (e.g., price[gte]=10)
        for (const [key, value] of Object.entries(filters)) {
            const match = key.match(/^(.+)\[(gte|gt|lte|lt)\]$/);
            if (match) {
                const [, field, op] = match;
                mongoQuery[field] = {
                    ...mongoQuery[field],
                    [`$${op}`]: isNaN(value) ? value : Number(value)
                };
            } else {
                mongoQuery[key] = isNaN(value) ? value : Number(value);
            }
        }

        // Handle tag-based filtering (for services with tags array)
        // Example: ?tags=tag1,tag2
        if (tags) {
            // Split tags by comma, trim whitespace
            const tagArr = tags.split(',').map(tag => tag.trim()).filter(Boolean);
            if (tagArr.length > 0) {
                // $all ensures all specified tags are present in the service's tags array
                mongoQuery.tags = { $all: tagArr };
            }
        }

        // Apply the constructed filter to the query
        this.query = this.query.find(mongoQuery);
        return this; // For chaining
    }

    /**
     * Applies sorting to the query based on the 'sort' query parameter.
     * Default sort is by '-createdAt' (descending).
     * @returns {APIFeatures} - Returns this for chaining
     */
    sort() {
        if (this.queryString.sort) {
            // Support multi-field sorting: ?sort=price,-rating
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // Default sort by creation date descending
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    /**
     * Limits the fields returned in the query based on the 'fields' query parameter.
     * Default excludes the '__v' field.
     * @returns {APIFeatures} - Returns this for chaining
     */
    limitFields() {
        if (this.queryString.fields) {
            // Support multi-field selection: ?fields=title,price
            const allowedFields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(allowedFields);
        } else {
            // Exclude Mongoose version key by default
            this.query = this.query.select('-__v');
        }
        return this;
    }

    /**
     * Applies pagination to the query based on 'page' and 'limit' query parameters.
     * Defaults: page=1, limit=100.
     * @returns {APIFeatures} - Returns this for chaining
     */
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;