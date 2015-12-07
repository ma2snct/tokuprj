var app = module.parent.exports

exports.index = function(req, res, next) {
  res.render('index', { title: 'Express' });
};
