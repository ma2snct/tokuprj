var express = require('express')
  ,multer = require('multer');

var app = express();

app.get('/', function(req, res){
  res.send('Hello, World');
});

//------
//to upload file
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

app.get('/file', function(req, res, next) {
  res.render('files', {title:'File_io'});
});

//Error: ENOENT, open 11/16 can't find uploaded file.
//-> must make folder before run
app.post('/add', upload.single('avatar'), function (req, res, next){
  console.log(req.file)
  res.render('files', {title:'File_io add'});
  res.status(204).end();
});

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.engine('ejs', require('ejs-locals'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser('keyboard cat'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(__dirname + 'public'));
  //app.use(express.static(path.join(__dirname + 'public')));
});



app.listen(3000, function(){
  console.log("Express server listening on http://localhost:3000");
});
