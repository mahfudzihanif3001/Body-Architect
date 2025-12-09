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
const UserController = require("./controllers/UserController");
const PlanController = require("./controllers/PlanController");

// --- SETUP MIDDLEWARE ---
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(requestActivity);


// 1. Public Routes 
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to BodyArchitect API" });
});
app.post("/register", UserController.register);
app.post("/login", UserController.login);

// 2. Protected Routes
app.use(authentication); 

// app.get("/dashboard", PlanController.getDashboard);
// app.post("/generate-plan", PlanController.generateCompletePlan);

// app.put("/meals/:id", authorization, PlanController.updateMeal);
// app.delete("/meals/:id", authorization, PlanController.deleteMeal);


// --- ERROR HANDLING ---
app.use(errorHandler);

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`BodyArchitect is running on port https://localhost:${PORT}`);
});

module.exports = app;