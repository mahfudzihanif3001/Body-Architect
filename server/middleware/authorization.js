const { Meal, Workout, DailyPlan } = require("../models");

const authorization = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const userId = req.user.id;
    let item;

    // VALIDASI TIPE (Agar tidak error 500 saat tipe unknown)
    if (type === "meal") {
      item = await Meal.findByPk(id, { include: { model: DailyPlan } });
    } else if (type === "workout") {
      item = await Workout.findByPk(id, { include: { model: DailyPlan } });
    } else {
      // Ini yang ditunggu test case "Invalid Type"
      throw { name: "BadRequest", message: "Invalid item type" };
    }

    if (!item) throw { name: "NotFound" };

    if (item.DailyPlan.userId !== userId) {
      throw { name: "Forbidden" };
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authorization;
