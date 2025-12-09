'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Meal extends Model {
    static associate(models) {
      // Relasi balik ke DailyPlan
      Meal.belongsTo(models.DailyPlan, { foreignKey: 'dailyPlanId' });
    }
  }
  Meal.init({
    dailyPlanId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    calories: DataTypes.INTEGER,
    protein: DataTypes.FLOAT,
    carbs: DataTypes.FLOAT,
    fat: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Meal',
  });
  return Meal;
};