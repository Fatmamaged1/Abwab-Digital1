const ApiError = require("../utils/ApiError");

const handleJwtInvalidSignatureError = () =>
  new ApiError("Invalid token, please login again", 401);

const handleJwtExpiredSignatureError = () =>
  new ApiError("Expired token, please login again", 401);

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : '';
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new ApiError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ApiError(message, 400);
};

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorForProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === "JsonWebTokenError") {
      error = handleJwtInvalidSignatureError();
    }
    if (err.name === "TokenExpiredError") {
      error = handleJwtExpiredSignatureError();
    }
    if (err.name === "ValidationError") {
      error = handleValidationError(err);
    }
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    }
    if (err.name === "CastError") {
      error = handleCastErrorDB(err);
    }

    sendErrorForProd(error, res);
  }
};

module.exports = globalError;
