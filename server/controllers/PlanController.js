const { User, DailyPlan, Workout, Meal } = require("../models");
const {
  generateWorkoutWithAI,
  getCaloriesForMeal,
} = require("../helpers/thirdParty");
const { Op } = require("sequelize");

class PlanController {
  // --- A. PUBLIC / HOME ---
  static async getHome(req, res, next) {
    try {
      const { type, sort, page = 1, limit = 8, search } = req.query;

      const queryOptions = {
        where: {},
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        attributes: ["name", "type", "calories_burned", "duration_mins"],
      };

      // 1. SEARCH (Case Insensitive)
      if (search) {
        queryOptions.where.name = { [Op.iLike]: `%${search}%` };
      }

      // 2. FILTER BY TYPE
      if (type) {
        queryOptions.where.type = type;
      }

      // 3. SORTING
      if (sort) {
        switch (sort) {
          case "calories_desc":
            queryOptions.order = [["calories_burned", "DESC"]];
            break;
          case "calories_asc":
            queryOptions.order = [["calories_burned", "ASC"]];
            break;
          case "duration_desc":
            queryOptions.order = [["duration_mins", "DESC"]];
            break;
          case "duration_asc":
            queryOptions.order = [["duration_mins", "ASC"]];
            break;
          default:
            queryOptions.order = [["createdAt", "DESC"]];
        }
      } else {
        queryOptions.order = [["createdAt", "DESC"]];
      }

      const { count, rows } = await Workout.findAndCountAll(queryOptions);

      res.status(200).json({
        data: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // --- B. DASHBOARD & STATS (Chart Ready) ---
  static async getDashboard(req, res, next) {
    try {
      const { role, id } = req.user;

      if (role === "admin") {
        const totalUsers = await User.count();
        const totalPlans = await DailyPlan.count({
          where: { status: "active" },
        });
        res.status(200).json({
          role: "Admin",
          message: "Welcome Admin",
          statistics: { total_users: totalUsers, active_plans: totalPlans },
        });
      } else {
        // 1. Ambil 7 Plan Terakhir
        const weeklyPlans = await DailyPlan.findAll({
          where: { userId: id },
          include: [{ model: Workout }, { model: Meal }],
          limit: 7,
          order: [["date", "ASC"]],
        });

        // 2. Tentukan Plan "Hari Ini"
        const myPlan = weeklyPlans.length > 0 ? weeklyPlans[0] : null;

        // 3. Hitung Statistik Mingguan (Untuk Diagram Batang)
        let weeklyStats = { labels: [], intake: [], burned: [] };
        let startDate = "-";
        let endDate = "-";

        if (weeklyPlans.length > 0) {
          startDate = weeklyPlans[0].date;
          endDate = weeklyPlans[weeklyPlans.length - 1].date;

          weeklyPlans.forEach((plan) => {
            const dayIntake = plan.Meals.reduce(
              (acc, curr) => acc + (curr.isCompleted ? curr.calories : 0),
              0
            );
            const dayBurned = plan.Workouts.reduce(
              (acc, curr) =>
                acc + (curr.isCompleted ? curr.calories_burned : 0),
              0
            );

            const dateObj = new Date(plan.date);
            weeklyStats.labels.push(
              dateObj.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })
            );
            weeklyStats.intake.push(dayIntake);
            weeklyStats.burned.push(dayBurned);
          });
        }

        // 4. Summary Hari Ini
        let todayBurned = 0;
        let todayIntake = 0;
        if (myPlan) {
          todayBurned = myPlan.Workouts.reduce(
            (a, b) => a + (b.isCompleted ? b.calories_burned : 0),
            0
          );
          todayIntake = myPlan.Meals.reduce(
            (a, b) => a + (b.isCompleted ? b.calories : 0),
            0
          );
        }

        res.status(200).json({
          role: "User",
          message: "Let's crush your goals!",
          date_range: { start: startDate, end: endDate },
          weekly_stats: weeklyStats,
          today_summary: {
            calories_intake: todayIntake,
            calories_burned: todayBurned,
          },
          today_plan: myPlan || "No Plan",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // --- C. GENERATE PLAN (CORE LOGIC) ---
  static async generateCompletePlan(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      // 1. Panggil AI
      const aiResult = await generateWorkoutWithAI({
        goal: user.goal,
        activityLevel: user.activityLevel,
      });

      if (!aiResult.weekly_plan || aiResult.weekly_plan.length === 0) {
        throw {
          name: "ThirdPartyError",
          message: "AI Failed to generate plan",
        };
      }

      const today = new Date();

      // 2. Loop 7 Hari
      for (let i = 0; i < 7; i++) {
        const dayPlan = aiResult.weekly_plan[i];

        const planDate = new Date(today);
        planDate.setDate(today.getDate() + i);

        const newDailyPlan = await DailyPlan.create({
          userId: user.id,
          date: planDate,
          status: "active",
        });

        // 3. Simpan Workout (Mapping Data Detail dari AI)
        const workoutsData = dayPlan.workouts.map((w) => {
          return {
            dailyPlanId: newDailyPlan.id,
            name: w.name,

            reps: w.reps || "3 sets x 10 reps",
            duration_mins: w.duration_mins || 15,
            calories_burned: w.calories_estimate || 150,

            type: w.type,
            gifUrl: null,
            isCompleted: false,
          };
        });
        await Workout.bulkCreate(workoutsData);

        // 4. Simpan Meal (Fetch Kalori dari Spoonacular Paralel)
        const mealsData = await Promise.all(
          dayPlan.meals.map(async (m) => {
            try {
              const calories = await getCaloriesForMeal(m.name, m.type);
              return {
                dailyPlanId: newDailyPlan.id,
                name: m.name,
                type: m.type,
                calories: calories,
                protein: 20,
                carbs: 30,
                fat: 10,
                isCompleted: false,
              };
            } catch (err) {
              return {
                dailyPlanId: newDailyPlan.id,
                name: m.name,
                type: m.type,
                calories: 450,
                protein: 20,
                carbs: 30,
                fat: 10,
                isCompleted: false,
              };
            }
          })
        );
        await Meal.bulkCreate(mealsData);
      }

      res.status(201).json({ message: "Plan Generated Successfully" });
    } catch (error) {
      console.log("CRITICAL ERROR:", error);
      next(error);
    }
  }

  // --- D. CRUD STANDARD ---
  static async getAllPlans(req, res, next) {
    try {
      const plans = await DailyPlan.findAll({
        where: { userId: req.user.id },
        order: [["date", "DESC"]],
        include: [Workout, Meal],
      });
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }

  static async createPlan(req, res, next) {
    try {
      const { date, status } = req.body;
      const newPlan = await DailyPlan.create({
        userId: req.user.id,
        date: date || new Date(),
        status: status || "active",
        totalCaloriesIntake: 0,
        totalCaloriesBurned: 0,
      });
      res.status(201).json(newPlan);
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const plan = await DailyPlan.findOne({
        where: { id, userId: req.user.id },
      });
      if (!plan) throw { name: "NotFound" };
      await plan.update({ status });
      res.status(200).json({ message: "Plan updated", plan });
    } catch (error) {
      next(error);
    }
  }

  static async deletePlan(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await DailyPlan.findOne({
        where: { id, userId: req.user.id },
      });
      if (!plan) throw { name: "NotFound" };
      await plan.destroy();
      res.status(200).json({ message: "Plan deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async updateMeal(req, res, next) {
    try {
      const { id } = req.params;
      await Meal.update(req.body, { where: { id } });
      res.status(200).json({ message: "Meal updated" });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMeal(req, res, next) {
    try {
      const { id } = req.params;
      await Meal.destroy({ where: { id } });
      res.status(200).json({ message: "Meal deleted" });
    } catch (error) {
      next(error);
    }
  }

  static async toggleItemStatus(req, res, next) {
    try {
      const { type, id } = req.params;
      const { isCompleted } = req.body;

      if (type === "meal") {
        await Meal.update({ isCompleted }, { where: { id } });
      } else if (type === "workout") {
        await Workout.update({ isCompleted }, { where: { id } });
      } else {
        throw { name: "BadRequest", message: "Invalid type" };
      }

      res.status(200).json({ message: "Status updated" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PlanController;
