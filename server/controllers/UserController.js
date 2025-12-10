const { User } = require("../models");
const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { verifyGoogleToken } = require("../helpers/thirdParty");

class UserController {
  static async register(req, res, next) {
    try {
      const {
        username,
        email,
        password,
        age,
        gender,
        height,
        weight,
        activityLevel,
        goal,
      } = req.body;

      const newUser = await User.create({
        username,
        email,
        password,
        age,
        gender,
        height,
        weight,
        activityLevel,
        goal,
        tdee: 2000,
      });

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        message: "Register success",
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        throw { name: "BadRequest", message: "Email/Password required" };

      const user = await User.findOne({ where: { email } });
      if (!user) throw { name: "Unauthenticated" };

      if (!comparePassword(password, user.password))
        throw { name: "Unauthenticated" };

      const access_token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res
        .status(200)
        .json({ access_token, role: user.role, username: user.username });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { token } = req.body;
      const googlePayload = await verifyGoogleToken(token);
      const { email, name, sub } = googlePayload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          username: name,
          email: email,
          password: `google_${sub}_${Math.random()}`,
          role: "user",
          age: 20,
          gender: "male",
          height: 170,
          weight: 60,
          activityLevel: "moderate",
          goal: "maintenance",
          tdee: 2000,
        });
      }

      const access_token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res
        .status(200)
        .json({ access_token, role: user.role, username: user.username });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
      });
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { age, weight, height, activityLevel, goal, tdee, username } =
        req.body;

      const user = await User.findByPk(req.user.id);

      await user.update({
        username,
        age,
        weight,
        height,
        activityLevel,
        goal,
        tdee,
      });

      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] },
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) throw { name: "NotFound" };

      await user.destroy();
      res.status(200).json({ message: `User ${user.email} has been deleted` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
