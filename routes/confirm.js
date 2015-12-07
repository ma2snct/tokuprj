var app = module.parent.exports

/*
exports.confirm = function(req, res){
  res.redirect('/');
  return;
}
*/

exports.confirm = function(req, res){
  //before making input form
  var crypto = require("crypto");
  var passowrd = 'aoyama-labo';

  planeText = req.body.pw;

  var cipher = crypto.createCipher('aes192', passowrd); //algorithm, password
  cipher.update(planeText, 'utf8', 'hex'); //data, [input_encoding], [output_encoding]
  var cipheredText = cipher.final('hex');

  console.log(cipheredText);
  //console.log(req);


  res.redirect('/confirm/'+cipheredText);
  return;
};
