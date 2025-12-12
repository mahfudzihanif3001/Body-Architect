// --- 0. PRE-SETUP ENV & MOCK VARIABLES ---
process.env.GEMINI_API_KEY = "dummy_key";
process.env.SPOONACULAR_API_KEY = "dummy_key";
process.env.GOOGLE_CLIENT_ID = "dummy_client_id";

const mockAiResponse = {
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
        duration_mins: 15,
      },
      {
        name: "Mock Run",
        reps: "10 mins",
        type: "Cardio",
        calories_estimate: 150,
        duration_mins: 30,
      },
    ],
  })),
};

// Global Mocks
const mockGenerateContent = jest.fn();
const mockAxiosGet = jest.fn();
const mockVerifyIdToken = jest.fn();

// --- 1. FACTORY MOCKS ---
jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

jest.mock("axios", () => ({
  get: mockAxiosGet,
}));

jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

// --- 2. REQUIRE APP & MODELS ---
const request = require("supertest");
const app = require("../app");
const { sequelize, User, DailyPlan, Meal, Workout } = require("../models");
const { signToken } = require("../helpers/jwt");

// --- VARIABLES ---
let userToken = "";
let adminToken = "";
let userId = 0;
let secondUserId = 0;
let planId = 0;
let mealId = 0;
let workoutId = 0;

// --- 3. SETUP & TEARDOWN ---
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });

    // A. Create User Utama
    const user = await User.create({
      username: "tester",
      email: "test@mail.com",
      password: "password123",
      role: "user",
      age: 25,
      gender: "male",
      height: 170,
      weight: 60,
      activityLevel: "moderate",
      goal: "muscle_build",
      tdee: 2000,
    });
    userId = user.id;
    userToken = signToken({ id: user.id, email: user.email, role: user.role });

    // B. Create Admin
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
    adminToken = signToken({ id: admin.id, email: admin.email, role: admin.role });

    // C. Create User Kedua (Untuk Forbidden Test)
    const user2 = await User.create({
      username: "Victim",
      email: "victim@mail.com",
      password: "password123",
      role: "user",
      age: 25,
      gender: "female",
      height: 160,
      weight: 50,
      activityLevel: "low",
      goal: "weight_loss",
      tdee: 1800,
    });
    secondUserId = user2.id;

    // D. SEEDING MANUAL USER 1
    const manualPlan = await DailyPlan.create({
      userId: userId,
      date: new Date(),
      status: "active",
      totalCaloriesIntake: 0,
      totalCaloriesBurned: 0,
    });
    planId = manualPlan.id;

    const manualMeal = await Meal.create({
      dailyPlanId: planId,
      name: "Seeded Salad",
      type: "lunch",
      calories: 300,
      protein: 10,
      carbs: 20,
      fat: 5,
      isCompleted: false,
    });
    mealId = manualMeal.id;

    const manualWorkout = await Workout.create({
      dailyPlanId: planId,
      name: "Seeded Run",
      type: "Cardio",
      calories_burned: 200,
      duration_mins: 20,
      isCompleted: false,
    });
    workoutId = manualWorkout.id;

    // E. SEEDING MANUAL USER 2 (FIX CRITICAL ERROR)
    // Ini yang sebelumnya hilang, menyebabkan error "properties of null"
    const p2 = await DailyPlan.create({
      userId: secondUserId,
      date: new Date(),
      status: "active",
      totalCaloriesIntake: 0,
      totalCaloriesBurned: 0
    });
    
    await Meal.create({
      dailyPlanId: p2.id,
      name: "Victim Meal",
      type: "lunch",
      calories: 400,
      protein: 10,
      carbs: 20,
      fat: 5,
      isCompleted: false
    });

    // Seed dummy workouts untuk Public Routes
    await Workout.bulkCreate([
      { name: "Yoga", type: "Mobility", calories_burned: 100, duration_mins: 60 },
      { name: "HIIT", type: "Cardio", calories_burned: 500, duration_mins: 30 }
    ]);

  } catch (error) {
    console.error("Setup failed:", error);
  }
});

afterAll(async () => {
  await sequelize.close();
});

// --- RESET MOCKS BEFORE EACH TEST ---
beforeEach(() => {
  mockGenerateContent.mockResolvedValue({
    response: { text: () => JSON.stringify(mockAiResponse) },
  });

  mockAxiosGet.mockResolvedValue({
    data: {
      results: [{ nutrition: { nutrients: [{ name: "Calories", amount: 500 }] } }],
    },
  });

  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({
      email: "googleuser@mail.com",
      name: "Google User",
      sub: "123456789",
    }),
  });
});

// --- 4. TEST SUITE ---
describe("BodyArchitect Full Coverage Tests", () => {
  
  // === A. AUTHENTICATION ===
  describe("Authentication", () => {
    it("POST /register - Success", async () => {
      const res = await request(app).post("/register").send({
        username: "newuser",
        email: "new@mail.com",
        password: "password123",
        age: 20,
        gender: "female",
        height: 160,
        weight: 50,
        activityLevel: "low",
        goal: "maintenance",
      });
      expect(res.status).toBe(201);
    });

    it("POST /register - Fail (Validation)", async () => {
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

    it("POST /google-login - Success (New User)", async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ email: "newgoogle@mail.com", name: "New Google", sub: "99999" }),
      });
      const res = await request(app).post("/google-login").send({ token: "dummy" });
      expect(res.status).toBe(200);
    });

    it("POST /google-login - Success (Existing User)", async () => {
      const res = await request(app).post("/google-login").send({ token: "dummy" });
      expect(res.status).toBe(200);
    });

    it("POST /google-login - Fail (Invalid Token)", async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid Token"));
      const res = await request(app).post("/google-login").send({ token: "invalid" });
      expect(res.status).toBe(401);
    });
  });

  // === B. PUBLIC ROUTES ===
  describe("Public Routes", () => {
    it("GET / - Success Default", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });

    it("GET / - Search & Filter", async () => {
      const res = await request(app).get("/?search=HIIT&type=Cardio");
      expect(res.status).toBe(200);
    });

    const sorts = ["calories_desc", "calories_asc", "duration_desc", "duration_asc"];
    sorts.forEach((sort) => {
      it(`GET / - Sort ${sort}`, async () => {
        const res = await request(app).get(`/?sort=${sort}`);
        expect(res.status).toBe(200);
      });
    });
  });

  // === C. DASHBOARD & PROFILE ===
  describe("Dashboard", () => {
    it("GET /dashboard - Success", async () => {
      const res = await request(app).get("/dashboard").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("User");
    });

    it("GET /profile - Success", async () => {
      const res = await request(app).get("/profile").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("PUT /profile - Success", async () => {
      const res = await request(app).put("/profile").set("Authorization", `Bearer ${userToken}`).send({ age: 26 });
      expect(res.status).toBe(200);
    });
  });

  // === D. PLAN OPERATIONS ===
  describe("Plan Operations", () => {
    it("POST /generate-plan - Success (Mocked AI)", async () => {
      const res = await request(app)
        .post("/generate-plan")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Success/i);
    });

    it("POST /generate-plan - AI Failure (ThirdPartyError)", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => "invalid json" },
      });
      const res = await request(app)
        .post("/generate-plan")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(502);
    });

    it("POST /generate-plan - Spoonacular Fallback Coverage", async () => {
      mockAxiosGet.mockRejectedValue(new Error("Network Error"));
      const res = await request(app)
        .post("/generate-plan")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(201);
    });

    it("GET /daily-plans - Verify Data", async () => {
      const res = await request(app).get("/daily-plans").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
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

    it("DELETE /daily-plans/:id - Success", async () => {
      const tempPlan = await DailyPlan.create({ userId, date: new Date(), status: 'active' });
      const res = await request(app)
        .delete(`/daily-plans/${tempPlan.id}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });
  });

  // === E. ITEMS & AUTHZ ===
  describe("Item Actions", () => {
    it("PATCH /items/meal/:id - Success", async () => {
      const res = await request(app)
        .patch(`/items/meal/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
    });

    it("PATCH /items/workout/:id - Success", async () => {
      const res = await request(app)
        .patch(`/items/workout/${workoutId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
    });

    it("PATCH /items/meal/:id - Fail (Forbidden)", async () => {
      // Sekarang user2Meal pasti ada karena sudah di-seed di beforeAll
      const user2Meal = await Meal.findOne({
        include: { model: DailyPlan, where: { userId: secondUserId } },
      });
      
      const res = await request(app)
        .patch(`/items/meal/${user2Meal.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(403);
    });

    it("PATCH /items/unknown/:id - Fail (Invalid Type)", async () => {
      const res = await request(app)
        .patch(`/items/unknown/${mealId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
    });

    it("PATCH /items/meal/:id - Fail (Not Found)", async () => {
      const res = await request(app)
        .patch(`/items/meal/999999`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // === F. ADMIN ===
  describe("Admin Features", () => {
    it("GET /dashboard - Admin View", async () => {
      const res = await request(app).get("/dashboard").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("Admin");
    });

    it("GET /admin/users - Success", async () => {
      const res = await request(app).get("/admin/users").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("PUT /admin/users/:id - Update User", async () => {
      const res = await request(app)
        .put(`/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ goal: "weight_loss" });
      expect(res.status).toBe(200);
    });

    it("DELETE /admin/users/:id - Fail (Not Found)", async () => {
      const res = await request(app).delete(`/admin/users/99999`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("GET /admin/users - Fail (Forbidden for User)", async () => {
      const res = await request(app).get("/admin/users").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
    
    it("DELETE /admin/users/:id - Success", async () => {
      const res = await request(app).delete(`/admin/users/${secondUserId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // === G. ERROR HANDLING ===
  describe("Error Handling", () => {
    it("No Token - 401", async () => {
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(401);
    });

    it("Invalid Token Format - 401", async () => {
      const res = await request(app).get("/dashboard").set("Authorization", "Bearer invalidtoken");
      expect(res.status).toBe(401);
    });

    it("Sequelize Error (Validation/Constraint)", async () => {
      const spy = jest.spyOn(DailyPlan, "create").mockRejectedValue({ name: "SequelizeForeignKeyConstraintError" });
      const res = await request(app)
        .post("/daily-plans")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ date: "2025-01-01" });
      expect(res.status).toBe(400);
      spy.mockRestore();
    });

    it("General 500 Error", async () => {
      const spy = jest.spyOn(User, "findAll").mockRejectedValue(new Error("DB Crash"));
      const res = await request(app).get("/admin/users").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });
});