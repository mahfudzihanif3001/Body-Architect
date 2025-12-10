const { User, DailyPlan, Workout, Meal } = require("../models");
const { generateWorkoutWithAI } = require("../helpers/thirdParty");
const { Op } = require("sequelize");

class PlanController {
  static async getHome(req, res, next) {
    try {
      const { type, sort, page = 1, limit = 10, search } = req.query;

      const queryOptions = {
        where: {},
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        attributes: [
          "name",
          "type",
          "duration_mins",
          "calories_burned",
          "gifUrl",
        ],
      };

      if (search) {
        queryOptions.where.name = { [Op.iLike]: `%${search}%` };
      }

      if (type) {
        queryOptions.where.type = type;
      }

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
        title: "Workout Library",
        info: "Login to generate your personalized plan!",
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
        },
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req, res, next) {
    try {
      const { role, id } = req.user;

      if (role === "admin") {
        const totalUsers = await User.count();
        const totalPlans = await DailyPlan.count({
          where: { status: "active" },
        });
        const recentUsers = await User.findAll({
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: ["id", "username", "email", "createdAt"],
        });

        res.status(200).json({
          role: "Admin",
          message: "Welcome back, Admin!",
          statistics: {
            total_users: totalUsers,
            active_plans: totalPlans,
          },
          recent_registrations: recentUsers,
        });
      } else {
        const today = new Date().toISOString().split("T")[0];

        const myPlan = await DailyPlan.findOne({
          where: { userId: id, date: today },
          include: [{ model: Workout }, { model: Meal }],
        });

        let caloriesBurned = 0;
        let caloriesIntake = 0;
        if (myPlan) {
          if (myPlan.Workouts)
            caloriesBurned = myPlan.Workouts.reduce(
              (a, b) => a + b.calories_burned,
              0
            );
          if (myPlan.Meals)
            caloriesIntake = myPlan.Meals.reduce((a, b) => a + b.calories, 0);
        }

        res.status(200).json({
          role: "User",
          message: "Let's crush your goals today!",
          today_summary: {
            calories_intake: caloriesIntake,
            calories_burned: caloriesBurned,
          },
          today_plan:
            myPlan ||
            "You have no plan for today. Click 'Generate Plan' to start!",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getAllPlans(req, res, next) {
    try {
      const plans = await DailyPlan.findAll({
        where: { userId: req.user.id },
        order: [["date", "DESC"]],
        include: [{ model: Workout }, { model: Meal }],
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

  static async generateCompletePlan(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      const last7DaysPlans = await DailyPlan.findAll({
        where: { userId },
        include: [{ model: Workout }, { model: Meal }],
        limit: 7,
        order: [["date", "DESC"]],
      });

      let adherenceScore = null;

      if (last7DaysPlans.length > 0) {
        let totalItems = 0;
        let completedItems = 0;

        last7DaysPlans.forEach((plan) => {
          plan.Workouts.forEach((w) => {
            totalItems++;
            if (w.isCompleted) completedItems++;
          });
          plan.Meals.forEach((m) => {
            totalItems++;
            if (m.isCompleted) completedItems++;
          });
        });

        if (totalItems > 0) {
          adherenceScore = (completedItems / totalItems) * 100;
          console.log(`User Adherence Score: ${adherenceScore}%`);
        }
      }

      const aiResult = await generateWorkoutWithAI(
        { goal: user.goal, activityLevel: user.activityLevel },
        adherenceScore // Kirim skor ke AI
      );

      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const dayPlan = aiResult.weekly_plan[i];

        const planDate = new Date(today);
        planDate.setDate(today.getDate() + i);

        const newDailyPlan = await DailyPlan.create({
          userId: user.id,
          date: planDate,
          status: "active",
        });

        const workoutsData = dayPlan.workouts.map((w) => ({
          dailyPlanId: newDailyPlan.id,
          name: w.name,
          reps: w.reps,
          type: w.type,
          duration_mins: 15,
          calories_burned: 100,
          isCompleted: false,
        }));
        await Workout.bulkCreate(workoutsData);

        const mealsData = dayPlan.meals.map((m) => ({
          dailyPlanId: newDailyPlan.id,
          name: m.name,
          type: m.type,
          calories: m.calories,
          protein: 20,
          carbs: 30,
          fat: 10,
          isCompleted: false,
        }));
        await Meal.bulkCreate(mealsData);
      }

      res.status(201).json({
        message: "7-Day Adaptive Plan Generated Successfully!",
        previous_adherence:
          adherenceScore !== null
            ? `${adherenceScore.toFixed(1)}%`
            : "First Time",
        note:
          adherenceScore < 50 && adherenceScore !== null
            ? "We made it easier for you this week!"
            : "Plan adjusted to your progress.",
      });
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
