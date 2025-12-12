"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Workout extends Model {
    static associate(models) {
      Workout.belongsTo(models.DailyPlan, { foreignKey: "dailyPlanId" });
    }
  }
  Workout.init(
    {
      dailyPlanId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      duration_mins: DataTypes.INTEGER,
      calories_burned: DataTypes.INTEGER,
      type: DataTypes.STRING,
      gifUrl: DataTypes.STRING,
      isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Workout",
    }
  );
  return Workout;
};
