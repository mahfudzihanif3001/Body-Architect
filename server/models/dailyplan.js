"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DailyPlan extends Model {
    static associate(models) {
      DailyPlan.belongsTo(models.User, { foreignKey: "userId" });
      DailyPlan.hasMany(models.Meal, { foreignKey: "dailyPlanId" });
      DailyPlan.hasMany(models.Workout, { foreignKey: "dailyPlanId" });
    }
  }
  DailyPlan.init(
    {
      userId: DataTypes.INTEGER,
      date: DataTypes.DATEONLY,
      totalCaloriesIntake: DataTypes.INTEGER,
      totalCaloriesBurned: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "DailyPlan",
    }
  );
  return DailyPlan;
};
