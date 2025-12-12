const requestActivity = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

module.exports = requestActivity;