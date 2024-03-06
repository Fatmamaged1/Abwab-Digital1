class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields"];

    // Remove excluded fields from queryObj
    excludeFields.forEach((el) => delete queryObj[el]);

    // Convert queryObj to JSON string and replace operators
    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // Parse and apply the filtered query
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(",").join(" ")
      : "-createdAt"; // Assuming 'createdAt' is the default field to sort by

    // Apply sorting to the query
    this.mongooseQuery = this.mongooseQuery.sort(sortBy);

    return this;
  }

  limitFields() {
    const fields = this.queryString.fields
      ? this.queryString.fields.split(",").join(" ")
      : "-__v"; // Default fields to exclude

    // Select specified fields or exclude default ones
    this.mongooseQuery = this.mongooseQuery.select(fields);

    return this;
  }

  search(modelName) {
    if (this.queryString.keyword) {
      const query =
        modelName === "Products"
          ? {
              $or: [
                { title: { $regex: this.queryString.keyword, $options: "i" } },
                {
                  description: {
                    $regex: this.queryString.keyword,
                    $options: "i",
                  },
                },
              ],
            }
          : { name: { $regex: this.queryString.keyword, $options: "i" } };

      // Apply search query to the main query
      this.mongooseQuery = this.mongooseQuery.find(query);
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;

    // Pagination result
    const pagination = {
      currentPage: page,
      limit,
      numberOfPages: Math.ceil(countDocuments / limit),
    };

    // Determine next and previous pages
    const endIndex = page * limit;
    if (endIndex < countDocuments) pagination.next = page + 1;
    if (skip > 0) pagination.prev = page - 1;

    // Apply pagination to the query
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResult = pagination;

    return this;
  }
}

module.exports = ApiFeatures;
