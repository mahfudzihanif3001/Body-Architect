const errorHandler = (err, req, res, next) => {
  console.log("🔥 ERROR LOG:", err.name, "|", err.message);

  let status = 500;
  let message = "Internal Server Error";

  switch (err.name) {
    case "SequelizeValidationError":
    case "SequelizeUniqueConstraintError":
      status = 400;
      message = err.errors[0].message;
      break;

    case "SequelizeForeignKeyConstraintError":
      status = 400;
      message = "Data integrity violation: Invalid reference ID";
      break;

    case "SequelizeDatabaseError":
      status = 500;
      message = "Database query error";
      break;

    case "Unauthenticated":
    case "JsonWebTokenError":
      status = 401;
      message = "Invalid token or Email/Password is wrong";
      break;

    case "TokenExpiredError":
      status = 401;
      message = "Token expired, please login again";
      break;

    case "Forbidden":
      status = 403;
      message = "You are not authorized to access this resource";
      break;

    case "BadRequest":
      status = 400;
      message = err.message || "Bad Request";
      break;

    case "NotFound":
      status = 404;
      message = err.message || "Data not found";
      break;

    case "ThirdPartyError":
    case "AxiosError":
      status = 502;
      message = "Failed to fetch data from third-party service";
      if (err.message) message = err.message;
      break;

    case "GoogleGenerativeAIError":
      status = 503;
      message = "AI Service is currently unavailable";
      break;

    default:
      status = 500;
      message = "Internal Server Error";
      break;
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;
