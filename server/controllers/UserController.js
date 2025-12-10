const { User } = require('../models');
const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { verifyGoogleToken } = require('../helpers/thirdParty'); 

class UserController {
  
  // =================================================================
  // PUBLIC ACCESS
  // =================================================================

  static async register(req, res, next) {
    try {
      const { username, email, password, age, gender, height, weight, activityLevel, goal } = req.body;
      
      // Role default 'user' akan dihandle oleh defaultValue di Model/Migration
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
        tdee: 2000 // Bisa dihitung otomatis nanti
      });

      res.status(201).json({ 
        id: newUser.id, 
        email: newUser.email, 
        message: "Register success" 
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw { name: "BadRequest", message: "Email/Password required" };

      const user = await User.findOne({ where: { email } });
      if (!user) throw { name: "Unauthenticated" };

      if (!comparePassword(password, user.password)) throw { name: "Unauthenticated" };

      // Generate Token (Payload: ID, Email, Role)
      const access_token = signToken({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });
      
      res.status(200).json({ access_token, role: user.role, username: user.username });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { token } = req.body;
      // 1. Verifikasi Token ke Google (via Helper)
      const googlePayload = await verifyGoogleToken(token);
      const { email, name, sub } = googlePayload;

      // 2. Cari User atau Buat Baru
      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Register User Baru
        user = await User.create({
          username: name,
          email: email,
          password: `google_${sub}_${Math.random()}`, // Dummy password random
          role: 'user', // Default role
          // Isi data dummy agar validasi lolos, user diminta update di profile nanti
          age: 20, gender: 'male', height: 170, weight: 60, activityLevel: 'moderate', goal: 'maintenance', tdee: 2000
        });
      }

      const access_token = signToken({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });

      res.status(200).json({ access_token, role: user.role, username: user.username });
    } catch (error) {
      next(error);
    }
  }

  // =================================================================
  // USER PROTECTED ACCESS
  // =================================================================

  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { age, weight, height, activityLevel, goal, tdee, username } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      await user.update({
        username, age, weight, height, activityLevel, goal, tdee
      });

      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  // =================================================================
  // ADMIN ONLY ACCESS
  // =================================================================

  // 1. Lihat Semua User
  static async getAllUsers(req, res, next) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  // 2. Hapus User
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