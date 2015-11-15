var express = require('express');
var router = express.Router();

var fs = require('fs');

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

router.post('/add', function(req,res, next){
  console.log(req.body.file/*files.filefile.path*/);
  /*
  fs.readFile(req.body.file, 'utf-8', function(err, text){
    console.log(text);
  });
  */
  res.render('files', {title:'File_io add'});

});

module.exports = router;
