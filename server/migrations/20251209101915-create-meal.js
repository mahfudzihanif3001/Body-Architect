'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Meals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dailyPlanId: {
  type: Sequelize.INTEGER,
  references: {
    model: 'DailyPlans', // Mengarah ke tabel DailyPlans
    key: 'id'
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
},
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      calories: {
        type: Sequelize.INTEGER
      },
      protein: {
        type: Sequelize.FLOAT
      },
      carbs: {
        type: Sequelize.FLOAT
      },
      fat: {
        type: Sequelize.FLOAT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Meals');
  }
};