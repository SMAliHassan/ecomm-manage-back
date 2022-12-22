const AppError = require('../utils/appError');

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
  return new AppError(400, `Invalid ${err.path}: ${err.value}`);
};

const handleDuplicateFieldDB = err => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  return new AppError(400, `Duplicate Field value: ${value}. Please use another value!`);
};

const handleValidationErrorDB = err => new AppError(400, err.message);

const handleJWTError = () => new AppError(401, 'Invalid token! Please log in again.');

const handleJWTExpiredError = () =>
  new AppError(401, 'Your token has expired! Please log in again.');

const handleTokopediaPrivilegeError = () =>
  new AppError(
    403,
    'The shop owner has not provided you the required privilege to perform this action on this shop or its items.'
  );

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') return sendErrorDev(err, res);

  if (process.env.NODE_ENV === 'production') {
    // let error

    // Cast to ObjectID Error
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    // Duplicate fields Error
    if (err.code === 11000) err = handleDuplicateFieldDB(err);
    // Validation Error
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    // JasonWebToken Error
    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);
    // JWT Expired Error
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError(err);
    // Tokopedia Dont have required privilige Error
    if (err.message.trim().startsWith('RBAC_MDLW_002')) err = handleTokopediaPrivilegeError(err);

    return sendErrorProd(err, res);
  }
};
