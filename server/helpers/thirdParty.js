const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OAuth2Client } = require("google-auth-library");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const workoutSplits = {
  muscle_build: [
    "Push Day (Chest, Shoulders, Triceps)",
    "Pull Day (Back, Biceps, Forearms)",
    "Leg Day (Quads, Hamstrings, Calves)",
    "Active Recovery (Yoga/Light Cardio)",
    "Upper Body Composite",
    "Lower Body Composite",
    "Rest & Mobility",
  ],
  weight_loss: [
    "HIIT Cardio",
    "Full Body Strength Circuit",
    "Steady State Cardio",
    "Core & Abs Blaster",
    "Tabata Style",
    "Functional Movement",
    "Active Recovery",
  ],
  maintenance: [
    "Total Body Strength",
    "Endurance Cardio",
    "Functional Mobility",
    "Core Stability",
    "Strength & Conditioning",
    "Outdoor Activity",
    "Restorative Yoga",
  ],
};

const getMealPlan = async (targetCalories) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/mealplanner/generate`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          timeFrame: "day",
          targetCalories: targetCalories,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Spoonacular Error:", error.message);
    return null;
  }
};

const getExerciseGif = async (exerciseName) => {
  try {
    const response = await axios.get(
      `https://exercisedb.p.rapidapi.com/exercises/name/${exerciseName}`,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "exercisedb.p.rapidapi.com",
        },
      }
    );
    if (response.data && response.data.length > 0) {
      return response.data[0].gifUrl;
    }
    return "https://dummyimage.com/300x200/cccccc/000000&text=No+GIF";
  } catch (error) {
    return "https://dummyimage.com/300x200/cccccc/000000&text=No+GIF";
  }
};

const generateWorkoutWithAI = async (userProfile, previousAdherence = null) => {
  const goalKey =
    userProfile.goal && workoutSplits[userProfile.goal]
      ? userProfile.goal
      : "maintenance";

  const weeklyThemes = workoutSplits[goalKey];

  let feedbackContext = "";
  if (previousAdherence !== null) {
    if (previousAdherence < 50) {
      feedbackContext = `User struggled last week (${previousAdherence.toFixed(
        1
      )}%). REDUCE intensity.`;
    } else if (previousAdherence > 85) {
      feedbackContext = `User did great (${previousAdherence.toFixed(
        1
      )}%). INCREASE intensity.`;
    } else {
      feedbackContext = `User is consistent (${previousAdherence.toFixed(
        1
      )}%). Keep momentum.`;
    }
  } else {
    feedbackContext = "New User. Balanced plan.";
  }

  const prompt = `
    Role: Fitness Coach.
    Profile: Goal '${goalKey}', Level '${userProfile.activityLevel}'.
    Context: ${feedbackContext}

    Task: Create a 7-DAY Workout & Meal Plan.
    
    Daily Themes:
    1: ${weeklyThemes[0]}
    2: ${weeklyThemes[1]}
    3: ${weeklyThemes[2]}
    4: ${weeklyThemes[3]}
    5: ${weeklyThemes[4]}
    6: ${weeklyThemes[5]}
    7: ${weeklyThemes[6]}

    Requirements:
    - 3 Meals (Breakfast, Lunch, Dinner) per day.
    - 3 Exercises (Name, Reps, Type) per day.
    
    Output JSON Schema:
    {
      "weekly_plan": [
        {
          "day_number": 1,
          "theme_title": "${weeklyThemes[0]}",
          "meals": [{"name": "string", "type": "breakfast", "calories": 0}, ...],
          "workouts": [{"name": "string", "reps": "string", "type": "string"}, ...]
        }
        ... (repeat for 7 days)
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw { name: "ThirdPartyError", message: "AI Service Failed" };
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
    console.error("Google Auth Error:", error.message);
    throw { name: "Unauthenticated", message: "Invalid Google Token" };
  }
};

module.exports = {
  getMealPlan,
  getExerciseGif,
  generateWorkoutWithAI,
  verifyGoogleToken,
};
