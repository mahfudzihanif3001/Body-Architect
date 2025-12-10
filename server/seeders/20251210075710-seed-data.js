'use strict';
const fs = require('fs');
const bcrypt = require('bcryptjs'); // Pastikan sudah npm install bcryptjs

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Baca file JSON
    const data = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8'));

    // 2. Modifikasi data sebelum insert (Hash Password + Timestamps)
    const usersToInsert = data.map(user => {
      // Hash Password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(user.password, salt);

      // Kembalikan object baru dengan password terenkripsi & timestamp
      return {
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // 3. Masukkan ke Database
    await queryInterface.bulkInsert('Users', usersToInsert, {});
  },

  async down (queryInterface, Sequelize) {
    // Menghapus semua data user saat undo seeder
    await queryInterface.bulkDelete('Users', null, {});
  }
};