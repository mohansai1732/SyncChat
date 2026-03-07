export const errorHandler = (err, req, res, next) => {
  console.error('[ErrorHandler]', err.message, 'statusCode:', res.statusCode, 'path:', req.method, req.originalUrl);
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = 'User already exists with this email.';
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
