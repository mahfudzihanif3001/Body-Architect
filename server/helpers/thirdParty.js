const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OAuth2Client } = require("google-auth-library");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: { responseMimeType: "application/json" },
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const workoutSplits = {
  muscle_build: [
    "Push Day",
    "Pull Day",
    "Leg Day",
    "Active Recovery",
    "Upper Body",
    "Lower Body",
    "Mobility",
  ],
  weight_loss: [
    "HIIT Cardio",
    "Full Body Circuit",
    "Steady Cardio",
    "Core Blaster",
    "Tabata",
    "Functional",
    "Active Recovery",
  ],
  maintenance: [
    "Total Body",
    "Endurance",
    "Mobility",
    "Core Stability",
    "Strength",
    "Outdoor",
    "Yoga",
  ],
};

// 1. AMBIL KALORI MAKANAN
const getCaloriesForMeal = async (mealName, type) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          query: mealName,
          number: 1,
          addRecipeNutrition: true,
        },
        timeout: 2000,
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      const calories = response.data.results[0].nutrition.nutrients.find(
        (n) => n.name === "Calories"
      )?.amount;
      return Math.round(calories) || 500;
    }
    if (type === "breakfast")
      return Math.floor(Math.random() * (500 - 300) + 300);
    return Math.floor(Math.random() * (700 - 450) + 450);
  } catch (error) {
    if (type === "breakfast")
      return Math.floor(Math.random() * (500 - 300) + 300);
    return Math.floor(Math.random() * (700 - 450) + 450);
  }
};

// 2. GENERATE AI
const generateWorkoutWithAI = async (userProfile, previousAdherence = null) => {
  const goalKey = userProfile.goal || "maintenance";
  const weeklyThemes = workoutSplits[goalKey] || workoutSplits["maintenance"];
  let feedbackContext =
    previousAdherence !== null
      ? `Adherence: ${previousAdherence.toFixed(1)}%`
      : "New User";

  const prompt = `
    Role: Fitness Coach. Goal: ${goalKey}. Level: ${userProfile.activityLevel}.
    Task: Create a 7-DAY Workout & Meal Plan.
    
    REQUIREMENTS:
    1. Meals: 3 per day (Name & Type only).
    2. Exercises: 3 per day. 
       - Name: Standard names.
       - Calories: ESTIMATE CALORIES (integer) for 15 mins. MUST BE VARIED (e.g. 80, 150, 220).
    
    Output JSON Schema:
    {
      "weekly_plan": [
        {
          "day_number": 1,
          "theme_title": "${weeklyThemes[0]}",
          "meals": [{"name": "Oatmeal", "type": "breakfast"}],
          "workouts": [
            {
              "name": "Push Up", 
              "reps": "3 sets 12 reps", 
              "type": "Strength", 
              "calories_estimate": 120
            }
          ]
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Gen Error:", error);
    // Return dummy agar tidak crash
    return { weekly_plan: [] };
  }
};

const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw { name: "Unauthenticated", message: "Invalid Google Token" };
  }
};

module.exports = {
  getCaloriesForMeal,
  generateWorkoutWithAI,
  verifyGoogleToken,
};
