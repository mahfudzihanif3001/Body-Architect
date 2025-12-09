'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Workout extends Model {
    static associate(models) {
      // Relasi balik ke DailyPlan
      Workout.belongsTo(models.DailyPlan, { foreignKey: 'dailyPlanId' });
    }
  }
  Workout.init({
    dailyPlanId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    duration_mins: DataTypes.INTEGER,
    calories_burned: DataTypes.INTEGER,
    type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Workout',
  });
  return Workout;
};