const request = require("supertest");
const app = require("../app");
const { sequelize, User, DailyPlan, Meal, Workout } = require("../models");

// --- 1. MOCKING THIRD PARTY ---
jest.mock("../helpers/thirdParty", () => ({
  verifyGoogleToken: jest.fn(() =>
    Promise.resolve({
      email: "googleuser@mail.com",
      name: "GoogleUser",
      sub: "123456789",
    })
  ),
  getMealPlan: jest.fn(() => Promise.resolve({ meals: [] })),
  getExerciseGif: jest.fn(() => Promise.resolve("http://dummy.gif")),
  generateWorkoutWithAI: jest.fn(() =>
    Promise.resolve({
      weekly_plan: Array.from({ length: 7 }, (_, i) => ({
        day_number: i + 1,
        meals: [
          { name: "Mock Oatmeal", type: "breakfast", calories: 300 },
          { name: "Mock Salad", type: "lunch", calories: 400 },
          { name: "Mock Steak", type: "dinner", calories: 500 },
        ],
        workouts: [
          { name: "Mock Pushup", reps: "10", type: "Strength" },
          { name: "Mock Run", reps: "10 mins", type: "Cardio" },
          { name: "Mock Plank", reps: "1 min", type: "Core" },
        ],
      })),
    })
  ),
}));

let userToken = "";
let adminToken = "";
let userId = 0;
let planId = 0;
let mealId = 0;
let workoutId = 0;

// --- 2. SETUP & TEARDOWN ---
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true }); // Reset DB

    const admin = await User.create({
      username: "admin_tester",
      email: "admin@mail.com",
      password: "adminpassword",
      role: "admin",
      age: 30,
      gender: "male",
      height: 180,
      weight: 80,
      activityLevel: "high",
      goal: "maintenance",
      tdee: 2500,
    });
  } catch (error) {
    console.error("Setup failed:", error);
  }
});

afterAll(async () => {
  await sequelize.close();
});

// --- 3. TEST SUITE ---
describe("BodyArchitect Comprehensive Tests", () => {
  // === GROUP A: AUTHENTICATION (6 Tests) ===
  describe("Authentication Routes", () => {
    it("1. POST /register - Success", async () => {
      const res = await request(app).post("/register").send({
        username: "tester",
        email: "test@mail.com",
        password: "password123",
        age: 25,
        gender: "male",
        height: 170,
        weight: 60,
        activityLevel: "moderate",
        goal: "muscle_build",
      });
      expect(res.status).toBe(201);
      userId = res.body.id;
    });

    it("2. POST /register - Fail (Duplicate Email)", async () => {
      const res = await request(app).post("/register").send({
        username: "tester2",
        email: "test@mail.com",
        password: "password123", // Email sama
        age: 25,
        gender: "male",
        height: 170,
        weight: 60,
        activityLevel: "moderate",
        goal: "muscle_build",
      });
      expect(res.status).toBe(400); // Validation error
    });

    it("3. POST /register - Fail (Empty Fields)", async () => {
      const res = await request(app).post("/register").send({
        username: "",
        email: "",
        password: "",
      });
      expect(res.status).toBe(400);
    });

    it("4. POST /login - Success (User)", async () => {
      const res = await request(app).post("/login").send({
        email: "test@mail.com",
        password: "password123",
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("access_token");
      userToken = res.body.access_token;
    });

    it("5. POST /login - Fail (Wrong Password)", async () => {
      const res = await request(app).post("/login").send({
        email: "test@mail.com",
        password: "salah",
      });
      expect(res.status).toBe(401);
    });

    it("6. POST /login - Fail (User Not Found)", async () => {
      const res = await request(app).post("/login").send({
        email: "gaada@mail.com",
        password: "password123",
      });
      expect(res.status).toBe(401);
    });
  });

  // === GROUP B: GOOGLE LOGIN (1 Test) ===
  describe("Google Auth", () => {
    it("7. POST /google-login - Success (Mocked)", async () => {
      const res = await request(app)
        .post("/google-login")
        .send({ token: "dummy_token" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("access_token");
    });
  });

  // === GROUP C: USER PROFILE (3 Tests) ===
  describe("User Profile", () => {
    it("8. GET /profile - Success", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe("test@mail.com");
    });

    it("9. PUT /profile - Success", async () => {
      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ username: "tester_updated", age: 26 });
      expect(res.status).toBe(200);
    });

    it("10. GET /profile - Fail (No Token)", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(401);
    });
  });

  // === GROUP D: PLANS & AI (7 Tests) ===
  describe("Plans & AI Features", () => {
    it("11. POST /generate-plan - Success (AI Mock)", async () => {
      const res = await request(app)
        .post("/generate-plan")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(201);
    });

    it("12. POST /daily-plans - Success (Manual Create)", async () => {
      const res = await request(app)
        .post("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ date: "2025-12-30", status: "active" });
      expect(res.status).toBe(201);
    });

    it("13. GET /daily-plans - Success", async () => {
      const res = await request(app)
        .get("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);

      const aiPlan = res.body.find((p) => p.Meals && p.Meals.length > 0);

      if (aiPlan) {
        planId = aiPlan.id;
        if (aiPlan.Meals.length > 0) mealId = aiPlan.Meals[0].id;
        if (aiPlan.Workouts.length > 0) workoutId = aiPlan.Workouts[0].id;
      } else {
        planId = res.body[0].id;
      }
    });
    it("14. PUT /daily-plans/:id - Success", async () => {
      const res = await request(app)
        .put(`/daily-plans/${planId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "completed" });
      expect(res.status).toBe(200);
      expect(res.body.plan.status).toBe("completed");
    });

    it("15. PUT /daily-plans/:id - Fail (Not Found)", async () => {
      const res = await request(app)
        .put(`/daily-plans/999999`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "completed" });
      expect(res.status).toBe(404);
    });

    it("16. DELETE /daily-plans/:id - Success", async () => {
      const plans = await request(app)
        .get("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`);
      const lastPlanId = plans.body[plans.body.length - 1].id;

      const res = await request(app)
        .delete(`/daily-plans/${lastPlanId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("17. DELETE /daily-plans/:id - Fail (Not Found)", async () => {
      const res = await request(app)
        .delete(`/daily-plans/999999`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // === GROUP E: ITEM ACTIONS (MEALS/WORKOUTS) (4 Tests) ===
  describe("Item Actions", () => {
    it("18. PATCH /items/meal/:id - Toggle Status Success", async () => {
      const res = await request(app)
        .patch(`/items/meal/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
    });

    it("19. PATCH /items/workout/:id - Toggle Status Success", async () => {
      const res = await request(app)
        .patch(`/items/workout/${workoutId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
    });

    it("20. PUT /meals/:id - Update Content", async () => {
      const res = await request(app)
        .put(`/meals/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Oatmeal" });
      expect(res.status).toBe(200);
    });

    it("21. DELETE /meals/:id - Success", async () => {
      const res = await request(app)
        .delete(`/meals/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });
  });

  // === GROUP F: DASHBOARD (1 Test) ===
  describe("Dashboard", () => {
    it("22. GET /dashboard - Success", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("User");
    });
  });

  // === GROUP G: ADMIN FEATURES (5 Tests) ===
  describe("Admin Features", () => {
    it("23. POST /login (Admin) - Success", async () => {
      const res = await request(app).post("/login").send({
        email: "admin@mail.com",
        password: "adminpassword",
      });
      expect(res.status).toBe(200);
      adminToken = res.body.access_token;
    });

    it("24. GET /admin/users - Fail (As Normal User)", async () => {
      const res = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403); // Forbidden
    });

    it("25. GET /admin/users - Success (As Admin)", async () => {
      const res = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("26. DELETE /admin/users/:id - Fail (As Normal User)", async () => {
      const res = await request(app)
        .delete(`/admin/users/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("27. DELETE /admin/users/:id - Success (As Admin)", async () => {
      const res = await request(app)
        .delete(`/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
