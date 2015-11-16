var express = require('express');
var router = express.Router();

var fs = require('fs');
var formidable = require("formidable");

//ルーティングで/filesに入ってきているのは前提
//それ以降のurlを
router.get('/', function(req, res, next) {
  /*
  fs.readFile('./public/static/sample.csv', 'utf-8', function(err, text){
    console.log(text);
  });
  */
  res.render('files', {title:'File_io'});
});

//Error: ENOENT, open でいかれ 11/16
router.post('/add', function(req,res, next){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    fs.rename(files.upload.path, "/tmp/test.csv", function(err){
      if(err) console.log('input err' + err);
    });
  });
//ファイルオープン

  fs.readFile("/tmp/test.csv", 'utf-8', function(err, file) {
    if(err) console.log('output err' + err);
    else console.log('done\n'+file);
  });
  res.render('files', {title:'File_io add'});

});

module.exports = router;
