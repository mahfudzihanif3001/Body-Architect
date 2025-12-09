const errorHandler = (err, req, res, next) => {
  console.log("ERROR HAPPENED:", err);

  let status = 500;
  let message = "Internal Server Error";

  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    status = 400;
    message = err.errors[0].message;
  } else if (err.name === "BadRequest") {
    status = 400;
    message = err.message;
  } else if (err.name === "Unauthenticated" || err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token or Email/Password";
  } else if (err.name === "Forbidden") {
    status = 403;
    message = "You are not authorized";
  } else if (err.name === "NotFound") {
    status = 404;
    message = "Data not found";
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;