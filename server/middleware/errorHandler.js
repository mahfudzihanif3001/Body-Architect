const errorHandler = (err, req, res, next) => {
  console.log("🔥 ERROR LOG:", err.name, "|", err.message);

  let status = 500;
  let message = "Internal Server Error";

  switch (err.name) {
    // --- A. SEQUELIZE / DATABASE ERRORS ---
    case "SequelizeValidationError":
    case "SequelizeUniqueConstraintError":
      status = 400;
      message = err.errors[0].message;
      break;
    
    case "SequelizeForeignKeyConstraintError":
      // Error relasi (misal: membuat Meal untuk DailyPlanId yang tidak ada)
      status = 400;
      message = "Data integrity violation: Invalid reference ID";
      break;

    case "SequelizeDatabaseError":
      // Error query SQL (biasanya salah tipe data atau kolom tidak ada)
      status = 500;
      message = "Database query error";
      break;

    // --- B. AUTHENTICATION ERRORS (JWT & LOGIN) ---
    case "Unauthenticated":
    case "JsonWebTokenError":
      // Token tidak valid atau user belum login
      status = 401;
      message = "Invalid token or Email/Password is wrong";
      break;

    case "TokenExpiredError":
      // Token sudah kadaluarsa
      status = 401;
      message = "Token expired, please login again";
      break;

    // --- C. AUTHORIZATION ERRORS (ROLES) ---
    case "Forbidden":
      // Login tapi tidak punya hak akses (User akses fitur Admin)
      status = 403;
      message = "You are not authorized to access this resource";
      break;

    // --- D. CLIENT ERRORS (CUSTOM) ---
    case "BadRequest":
      // Error manual yang dilempar dari Controller (misal: input kurang)
      status = 400;
      message = err.message || "Bad Request";
      break;

    case "NotFound":
      // Data tidak ditemukan di database
      status = 404;
      message = err.message || "Data not found";
      break;

    // --- E. THIRD PARTY ERRORS (Google, Spoonacular, RapidAPI) ---
    case "ThirdPartyError":
    case "AxiosError": // Jika axios gagal fetch data
      status = 502; // Bad Gateway
      message = "Failed to fetch data from third-party service";
      if (err.message) message = err.message;
      break;
      
    case "GoogleGenerativeAIError": // Error spesifik library Gemini
      status = 503;
      message = "AI Service is currently unavailable";
      break;

    // --- F. DEFAULT / UNHANDLED ERRORS ---
    default:
      status = 500;
      message = "Internal Server Error";
      break;
  }

  // Kirim respon ke Frontend
  res.status(status).json({ message });
};

module.exports = errorHandler;