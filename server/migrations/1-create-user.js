'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      username: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, defaultValue: 'user' }, // admin/user
      // Data Fisik
      age: Sequelize.INTEGER,
      gender: Sequelize.STRING,
      height: Sequelize.FLOAT,
      weight: Sequelize.FLOAT,
      activityLevel: Sequelize.STRING,
      goal: Sequelize.STRING,
      tdee: Sequelize.INTEGER,
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};