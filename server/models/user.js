"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.DailyPlan, { foreignKey: "userId" });
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [5, 20] },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "Username tidak boleh kosong" },
          notNull: { msg: "Username wajib diisi" },
        },
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "user",
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Age tidak boleh kosong" },
          notNull: { msg: "Age wajib diisi" },
          min: {
            args: 1,
            msg: "Age minimal 1",
          },
        },
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Gender tidak boleh kosong" },
          notNull: { msg: "Gender wajib diisi" },
        },
      },
      height: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Tinggi tidak boleh kosong" },
          notNull: { msg: "Tinggi wajib diisi" },
        },
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Berat tidak boleh kosong" },
          notNull: { msg: "Berat wajib diisi" },
        },
      },
      activityLevel: DataTypes.STRING,
      goal: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [["weight_loss", "muscle_build", "maintenance", "endurance"]], // Daftar yang diizinkan
            msg: "Goal must be one of: weight_loss, muscle_build, maintenance, or endurance",
          },
        },
      },
      tdee: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user, options) => {
          const salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        },
      },
    }
  );
  return User;
};
