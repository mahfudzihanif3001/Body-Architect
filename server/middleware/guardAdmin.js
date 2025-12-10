const guardAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next({ name: "Forbidden", message: "Restricted to Admin only" });
  }
};
module.exports = guardAdmin;