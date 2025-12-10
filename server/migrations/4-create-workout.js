'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Workouts', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      dailyPlanId: { 
        type: Sequelize.INTEGER,
        references: { model: 'DailyPlans', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING },
      duration_mins: { type: Sequelize.INTEGER },
      calories_burned: { type: Sequelize.INTEGER },
      type: { type: Sequelize.STRING },
      gifUrl: { type: Sequelize.STRING }, 
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Workouts');
  }
};