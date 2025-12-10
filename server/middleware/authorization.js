const { Meal, DailyPlan } = require('../models');

const authorization = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const userId = req.user.id;

    const meal = await Meal.findByPk(id, {
      include: { model: DailyPlan } 
    });

    if (!meal) throw { name: "NotFound" };

    if (meal.DailyPlan.userId !== userId) {
      throw { name: "Forbidden" };
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authorization;