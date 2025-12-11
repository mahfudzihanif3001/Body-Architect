const errorHandler = (err, req, res, next) => {
  // console.log("ERROR LOG:", err.name, err.message); // Uncomment jika perlu debug

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
      message = "Data integrity violation";
      break;

    case "BadRequest": // Pastikan ini ada!
      status = 400;
      message = err.message || "Bad Request";
      break;

    case "Unauthenticated":
    case "JsonWebTokenError":
      status = 401;
      message = "Invalid token";
      break;

    case "Forbidden":
      status = 403;
      message = "You are not authorized";
      break;

    case "NotFound":
      status = 404;
      message = "Data not found";
      break;

    case "ThirdPartyError":
    case "AxiosError":
      status = 502;
      message = "Third party service failed";
      break;

    default:
      status = 500;
      message = "Internal Server Error";
      break;
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;
