const { verifyToken } = require('../helpers/jwt');
const { User } = require('../models'); // Pastikan path benar

const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw { name: "Unauthenticated" };

    const token = authorization.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.id);
    if (!user) throw { name: "Unauthenticated" };

    // PERBAIKAN: Gunakan role dari database, bukan hardcode
    req.user = { 
        id: user.id, 
        email: user.email, 
        role: user.role // <--- Ini yang benar
    }; 
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authentication;