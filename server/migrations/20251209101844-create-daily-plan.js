'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DailyPlans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
  type: Sequelize.INTEGER,
  references: {
    model: 'Users', 
    key: 'id'      
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE' 
},
      date: {
        type: Sequelize.DATEONLY
      },
      totalCaloriesIntake: {
        type: Sequelize.INTEGER
      },
      totalCaloriesBurned: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('DailyPlans');
  }
};