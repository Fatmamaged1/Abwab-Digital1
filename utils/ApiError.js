class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "error" : "fail";
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from the stack
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
