const { validationResult } = require("express-validator");

const validatorMiddleware = (req, res, next) => {
  console.log("Request Body:", req.body);
 

  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  console.error("Validation Errors:", errors.array());

  return res.status(400).json({ errors: formatErrors(errors.array()) });
};

const formatErrors = (errorsArray) => {
  // You can customize the format of the errors if needed
  return errorsArray.map((error) => ({ [error.param]: error.msg }));
};

module.exports = validatorMiddleware;
