'use strict';
const fs = require('fs');
const bcrypt = require('bcryptjs'); // Pastikan sudah npm install bcryptjs

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const data = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8'));

    const users = data.map(el => {
      delete el.id; 
      el.password = bcrypt.hashSync(el.password, 10); 
      el.createdAt = new Date();
      el.updatedAt = new Date();
      return el;
    });

    await queryInterface.bulkInsert('Users', users, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};