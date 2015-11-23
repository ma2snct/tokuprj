var express = require('express');
var router = express.Router();

//var fs = require('fs');
//var formidable = require("formidable");

var multer  = require('multer')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //cb(null, '/tmp/my-uploads')
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage })



router.get('/', function(req, res, next) {
  /*
  fs.readFile('./public/static/sample.csv', 'utf-8', function(err, text){
    console.log(text);
  });
  */
  res.render('files', {title:'File_io'});
});

//Error: ENOENT, open 11/16 can't find uploaded file.
router.post('/add', upload.single('avatar'), function (req, res, next){
  console.log(req.file)
  res.render('files', {title:'File_io add'});
  res.status(204).end();
});

module.exports = router;
