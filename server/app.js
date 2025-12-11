if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const requestActivity = require("./middleware/requestActivity");
const errorHandler = require("./middleware/errorHandler");
const authentication = require("./middleware/authentication");
const authorization = require("./middleware/authorization");
const guardAdmin = require("./middleware/guardAdmin");
const UserController = require("./controllers/UserController");
const PlanController = require("./controllers/PlanController");

// --- SETUP MIDDLEWARE ---
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(requestActivity);

// app.get("/", (req, res) => {
//   res.status(200).json({
//     message: "Welcome to BodyArchitect API",
//     description: "Silakan Login atau Register untuk membuat rencana diet/latihan.",
//     endpoints: {
//       login_google: "POST /google-login",
//       register: "POST /register"
//     }
//   });
// });

app.get("/", PlanController.getHome);
app.post("/register", UserController.register);
app.post("/login", UserController.login);
app.post("/google-login", UserController.googleLogin);

// --- 2. PROTECTED ROUTES (Wajib Login) ---
app.use(authentication);

// A. Dashboard & Profile
app.get("/dashboard", PlanController.getDashboard);
app.get("/profile", UserController.getProfile);
app.put("/profile", UserController.updateProfile);

// B. Daily Plans
app.get("/daily-plans", PlanController.getAllPlans);
app.post("/generate-plan", PlanController.generateCompletePlan);
app.post("/daily-plans", PlanController.createPlan);
app.put("/daily-plans/:id", PlanController.updatePlan);
app.delete("/daily-plans/:id", PlanController.deletePlan);
app.patch("/items/:type/:id", authorization, PlanController.toggleItemStatus);

// C. Meals & Workouts
app.put("/meals/:id", authorization, PlanController.updateMeal);
app.delete("/meals/:id", authorization, PlanController.deleteMeal);

// --- 3. ADMIN ROUTES ---
app.get("/admin/users", guardAdmin, UserController.getAllUsers);
app.put("/admin/users/:id", guardAdmin, UserController.updateUserByAdmin);
app.delete("/admin/users/:id", guardAdmin, UserController.deleteUser);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`BodyArchitect is running on port http://localhost:${PORT}`);
  });
}

module.exports = app;
