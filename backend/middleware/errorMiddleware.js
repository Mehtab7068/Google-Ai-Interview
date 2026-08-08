const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // If response headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // If status code was not set explicitly (still 200), default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Explicitly set CORS headers so the browser receives the JSON error payload
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://google-ai-interview.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.status(statusCode).json({
    message: err.message || "An unexpected error occurred.",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };