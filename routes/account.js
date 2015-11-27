exports.account = function(req, res, next) {
  res.render('account', { user: req.user });
};
