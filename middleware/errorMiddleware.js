const ApiError = require("../utils/ApiError");
const handleJwtInvalidSignatureError = () =>
  new ApiError("invalid token", "please login again", 401);
  const handleJwtExpiredSignatureError = () =>
  new ApiError("Expired token", "please login again", 401);
const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    if (err.name === "jsonWebTokenError")
      err = handleJwtInvalidSignatureError(err, res);
      if (err.name === "jsonWebExpiredError")
      err = handleJwtExpiredSignatureError(err, res);
    return;
    sendErrorForProd;
  }
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
  res.status(err.statusCode).json({
    status: err.status,

    message: err.message,
  });
};

module.exports = globalError;
