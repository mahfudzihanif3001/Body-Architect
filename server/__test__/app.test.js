const request = require("supertest");
const app = require("../app");
const { sequelize, User, DailyPlan, Meal, Workout } = require("../models");
const { signToken } = require("../helpers/jwt");

// --- 1. MOCKING THIRD PARTY ---
jest.mock("../helpers/thirdParty", () => ({
  verifyGoogleToken: jest.fn(() =>
    Promise.resolve({
      email: "googleuser@mail.com",
      name: "GoogleUser",
      sub: "123456789",
    })
  ),
  getCaloriesForMeal: jest.fn(() => Promise.resolve(500)),
  generateWorkoutWithAI: jest.fn(() =>
    Promise.resolve({
      weekly_plan: Array.from({ length: 7 }, (_, i) => ({
        day_number: i + 1,
        meals: [
          { name: "Mock Oatmeal", type: "breakfast" },
          { name: "Mock Salad", type: "lunch" },
          { name: "Mock Steak", type: "dinner" },
        ],
        workouts: [
          {
            name: "Mock Pushup",
            reps: "10",
            type: "Strength",
            calories_estimate: 100,
          },
          {
            name: "Mock Run",
            reps: "10 mins",
            type: "Cardio",
            calories_estimate: 150,
          },
          {
            name: "Mock Plank",
            reps: "1 min",
            type: "Core",
            calories_estimate: 50,
          },
        ],
      })),
    })
  ),
}));

// Variabel Global
let userToken = "";
let adminToken = "";
let userId = 0;
let planId = 0;
let mealId = 0;
let workoutId = 0;

// --- 2. SETUP & TEARDOWN ---
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });

    // Buat Admin
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
    adminToken = signToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error("Setup failed:", error);
  }
});

afterAll(async () => {
  await sequelize.close();
});

// --- 3. TEST SUITE ---
describe("BodyArchitect Full Coverage Tests", () => {
  // === GROUP A: AUTHENTICATION (UserController) ===
  describe("Authentication", () => {
    it("POST /register - Success", async () => {
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

    it("POST /register - Fail (Validation Error)", async () => {
      const res = await request(app).post("/register").send({
        username: "tester",
        email: "invalid-email",
        password: "123",
      });
      expect(res.status).toBe(400);
    });

    it("POST /register - Fail (Duplicate Email)", async () => {
      const res = await request(app).post("/register").send({
        username: "tester2",
        email: "test@mail.com",
        password: "123",
        age: 25,
        gender: "male",
        height: 170,
        weight: 60,
        activityLevel: "moderate",
        goal: "muscle_build",
      });
      expect(res.status).toBe(400);
    });

    it("POST /login - Success", async () => {
      const res = await request(app).post("/login").send({
        email: "test@mail.com",
        password: "password123",
      });
      expect(res.status).toBe(200);
      userToken = res.body.access_token;
    });

    it("POST /login - Fail (Wrong Password)", async () => {
      const res = await request(app).post("/login").send({
        email: "test@mail.com",
        password: "wrong",
      });
      expect(res.status).toBe(401);
    });

    it("POST /login - Fail (User Not Found)", async () => {
      const res = await request(app).post("/login").send({
        email: "ghost@mail.com",
        password: "123",
      });
      expect(res.status).toBe(401);
    });

    it("POST /login - Fail (Bad Request)", async () => {
      const res = await request(app).post("/login").send({ email: "" });
      expect(res.status).toBe(400);
    });

    it("POST /google-login - Success", async () => {
      const res = await request(app)
        .post("/google-login")
        .send({ token: "dummy" });
      expect(res.status).toBe(200);
    });

    it("POST /google-login - Success (Existing User)", async () => {
      const res = await request(app)
        .post("/google-login")
        .send({ token: "dummy" });
      expect(res.status).toBe(200);
    });
  });

  // === GROUP B: PUBLIC ROUTES (PlanController.getHome) ===
  describe("Public Routes", () => {
    it("GET / - Success Default", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });

    it("GET / - Success with Filter & Sort", async () => {
      const res = await request(app).get(
        "/?search=push&type=Strength&sort=calories_desc&limit=5&page=1"
      );
      expect(res.status).toBe(200);
    });

    it("GET / - Success Sort Calories Asc", async () => {
      const res = await request(app).get("/?sort=calories_asc");
      expect(res.status).toBe(200);
    });

    it("GET / - Success Sort Duration Desc", async () => {
      const res = await request(app).get("/?sort=duration_desc");
      expect(res.status).toBe(200);
    });

    it("GET / - Success Sort Duration Asc", async () => {
      const res = await request(app).get("/?sort=duration_asc");
      expect(res.status).toBe(200);
    });
  });

  // === GROUP C: USER PROFILE & DASHBOARD ===
  describe("Dashboard & Profile", () => {
    it("GET /dashboard - Success (User)", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("User");
    });

    it("GET /profile - Success", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("PUT /profile - Success", async () => {
      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ username: "Updated Name", age: 26 });
      expect(res.status).toBe(200);
    });
  });

  // === GROUP D: PLAN GENERATION & CRUD ===
  describe("Plan Operations", () => {
    it("POST /generate-plan - Success", async () => {
      const res = await request(app)
        .post("/generate-plan")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(201);
    });

    it("GET /daily-plans - Verify Data & Capture IDs", async () => {
      const res = await request(app)
        .get("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);

      const plan = res.body[0];
      planId = plan.id;
      if (plan.Meals && plan.Meals.length > 0) mealId = plan.Meals[0].id;
      if (plan.Workouts && plan.Workouts.length > 0)
        workoutId = plan.Workouts[0].id;
    });

    it("POST /daily-plans - Manual Create", async () => {
      const res = await request(app)
        .post("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ date: "2025-12-31" });
      expect(res.status).toBe(201);
    });

    it("PUT /daily-plans/:id - Update Status", async () => {
      const res = await request(app)
        .put(`/daily-plans/${planId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "completed" });
      expect(res.status).toBe(200);
    });

    it("PUT /daily-plans/:id - Fail (Not Found)", async () => {
      const res = await request(app)
        .put(`/daily-plans/99999`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "completed" });
      expect(res.status).toBe(404);
    });

    it("DELETE /daily-plans/:id - Success", async () => {
      const plans = await request(app)
        .get("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`);
      const lastId = plans.body[0].id;
      const res = await request(app)
        .delete(`/daily-plans/${lastId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("DELETE /daily-plans/:id - Fail (Not Found)", async () => {
      const res = await request(app)
        .delete(`/daily-plans/99999`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // === GROUP E: ITEM ACTIONS (MEALS & WORKOUTS) ===
  describe("Item Actions", () => {
    it("PATCH /items/meal/:id - Toggle Meal", async () => {
      const res = await request(app)
        .patch(`/items/meal/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
    });

    it("PATCH /items/workout/:id - Toggle Workout", async () => {
      const res = await request(app)
        .patch(`/items/workout/${workoutId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
    });

    it("PATCH /items/unknown/:id - Fail (Invalid Type)", async () => {
      const res = await request(app)
        .patch(`/items/unknown/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
    });
  });

  // === GROUP F: ADMIN FEATURES ===
  describe("Admin Features", () => {
    it("GET /dashboard - Admin View", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("Admin");
    });

    it("GET /admin/users - Success", async () => {
      const res = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("PUT /admin/users/:id - Update User", async () => {
      const res = await request(app)
        .put(`/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ goal: "weight_loss", role: "user" });
      expect(res.status).toBe(200);
    });

    it("DELETE /admin/users/:id - Success", async () => {
      const res = await request(app)
        .delete(`/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("DELETE /admin/users/:id - Fail (Not Found)", async () => {
      const res = await request(app)
        .delete(`/admin/users/99999`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("GET /admin/users - Fail (Forbidden for User)", async () => {
      const uniqueEmail = `forbidden_${Date.now()}@mail.com`;
      await request(app).post("/register").send({
        username: "forbidden",
        email: uniqueEmail,
        password: "123",
        age: 20,
        gender: "male",
        height: 170,
        weight: 60,
        activityLevel: "low",
        goal: "maintenance",
      });

      // 2. Login User Biasa
      const loginRes = await request(app).post("/login").send({
        email: uniqueEmail,
        password: "123",
      });
      const validUserToken = loginRes.body.access_token;

      const res = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${validUserToken}`);

      if (res.status === 401) console.log("Fail 401 Reason:", res.body);

      expect(res.status).toBe(401);
    });
  });

  // === GROUP G: ERROR HANDLERS ===
  describe("Error Handling", () => {
    it("No Token - 401", async () => {
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(401);
    });

    it("Invalid Token - 401", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", "Bearer invalid");
      expect(res.status).toBe(401);
    });

    it("Internal Server Error Trigger (Spy)", async () => {
      const spy = jest
        .spyOn(User, "findAll")
        .mockRejectedValue(new Error("DB Crash"));
      const res = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });
});
