const guardAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    throw { name: "Forbidden" };
  }
  next();
};
module.exports = guardAdmin;