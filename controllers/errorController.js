const AppError = require('../utils/AppError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  // if error is operational: Send the error data
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }

  // if error is programmatical or other: Send a generic message
  if (!err.isOperational) {
    res.status(500).json({ status: 500, message: 'Something went very wrong!' });
  }
};

const handleCastErrorDB = err => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateFieldDB = err => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  return new AppError(`Duplicate Field value: ${value}. Please use another value!`, 400);
};

const handleValidationErrorDB = err => new AppError(err.message, 400);

const handleJWTError = () => new AppError('Invalid token! Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, res);

  // Cast to ObjectID Error
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  // Duplicate fields Error
  if (err.code === 11000) error = handleDuplicateFieldDB(err);
  // Validation Error
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  // JasonWebToken Error
  if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
  // JWT Expired Error
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(err);

  if (process.env.NODE_ENV === 'production') sendErrorProd(err, res);
};
