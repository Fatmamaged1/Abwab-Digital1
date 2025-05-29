const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/apiFeatures");
const marked = require("marked");
const mongoose = require("mongoose");
// Common error handler function
const handleErrors = (error, next) => {
  next(new ApiError(`Error: ${error.message}`, 500));
};

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // ✅ التحقق من أن الـ id صحيح (ObjectId)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(`Invalid ID format: ${id}`, 400));
    }

    const document = await Model.findByIdAndDelete(id);

    if (!document) {
      return next(new ApiError(`No document found for ID ${id}`, 404));
    }

    // ✅ تم الحذف بنجاح
    res.status(200).json({
      success: true,
      message: `Document with ID ${id} deleted successfully`,
      data: {}, // يمكنك هنا إرجاع `document` لو أحببت
    });
  });

  exports.updateClient = async (id, data) => {
    const client = await ClientModel.findById(id);
    if (!client) {
      return null;
    }
  
    // تحديث القيم الموجودة فقط
    Object.keys(data).forEach((key) => {
      client[key] = data[key];
    });
  
    await client.save();
    return client;
  };
  
exports.createOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  } catch (error) {
    handleErrors(error, next);
  }
};

exports.getOne = (Model, populationOpt) => async (req, res, next) => {
  // rest of your code...

  try {
  } catch (error) {}
  const { id } = req.params;
  const query = Model.findById(id);

  if (populationOpt) {
    query.populate(populationOpt);
  }

  try {
    const document = await query.lean();
    document.content = marked.parse(document.content); // Add this line to convert markdown to HTML
    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(200).json({ success: true, data: document });
    // Add return statement if necessary
  } catch (error) {
    handleErrors(error, next);
  }
};

exports.getAll = (Model, modelName = "") =>
  asyncHandler(async (req, res, next) => {
    try {
      let filter = {};
      if (req.filter) {
        filter = req.filter;
      }

      const documentsCount = await Model.countDocuments();
      const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
        .paginate(documentsCount)
        .filter()
        .search(modelName)
        .limitFields()
        .sort();

      const { mongooseQuery, paginationResult } = apiFeatures;
      const documents = await mongooseQuery.lean();

      res.status(200).json({
        success: true,
        results: documents.length,
        paginationResult,
        data: documents,
      });
      // Add return statement if necessary
    } catch (error) {
      handleErrors(error, next);
    }
  });
