const multer = require("multer");
const ApiError = require("../utils/ApiError");

const multerOptions = () => {
  try {
    const multerStorage = multer.memoryStorage();

    const multerFilter = function (req, file, cb) {
      try {
        cb(null, true);
      } catch (e) {
        console.error(e);
        cb(new ApiError("Error in fileFilter function", 500), false);
      }
    };

    const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

    return upload;
  } catch (e) {
    console.error(e);
    throw new ApiError("Error in multerOptions function", 500);
  }
};

exports.uploadSingleImage = (fieldName) => {
  try {
    return multerOptions().single(fieldName);
  } catch (e) {
    console.error(e);
    throw new ApiError("Error in uploadSingleImage function", 500);
  }
};

exports.uploadMixOfImages = (arrayOfFields) => {
  try {
    return multerOptions().fields(arrayOfFields);
  } catch (e) {
    console.error(e);
    throw new ApiError("Error in uploadMixOfImages function", 500);
  }
};
