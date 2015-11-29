//modules
var express = require('express')
  ,multer = require('multer')
  , passport = require('passport')
  , flash = require('connect-flash')
  , util = require('util')
  , HashStrategy = require('passport-hash').Strategy
  ,routes = require('./routes')
  ,http = require('http')

  ,csv = require('csv')
  ,fs = require('fs')
  ,nano = require('nano')('http://localhost:5984')
  ,db = require('nano')('http://localhost:5984/sotsu')
  ,sotsu = nano.use('sotsu')
  ,assert = require('assert');

//user
var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com', hash: 'a123bc45d678', status: 'offline' }
  , { id: 2, username: 'joe', email: 'joe@example.com', hash: '2f18983ad188fdc6e5dfd17fbdad59ea', status: 'unconfirmed' }
  , { id: 3, username: 'ryuji', email: 'joe@example.com', hash: 'd0e4bc8bbddf833689e2e38fd2cc42c8', status: 'unconfirmed' }
];

//to use passport
function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUserHash(hash, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.hash === hash) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


passport.use(new HashStrategy(
  function(hash, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      findByUserHash(hash, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.status != 'unconfirmed') { return done(null, false, { message: 'This user already confirmed' }); }
        return done(null, user);
      })
    });
  }
));

//to upload file
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

var app = express();

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
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + 'public'));
  //app.use(express.static(path.join(__dirname + 'public')));
});

//routing
app.get('/', routes.index);

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/confirm/:hash', passport.authenticate('hash', {
  failureRedirect: 'login', failureFlash: true
}), function(req, res) {
  //console.log(req.body)
  res.redirect('/account');
});

app.post('/confirm', function(req, res){
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
});

app.get('/logout', ensureAuthenticated, function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/file', function(req, res, next) {
  res.render('files', {title:'File_io'});
});

//Error: ENOENT, open 11/16 can't find uploaded file.
//-> must make folder before run
app.post('/add', upload.single('avatar'), function (req, res, next){
  console.log(req.file)
  res.render('account', {user:req.user,status:'File added'});
  res.status(204).end();
});

//to insert sample file to CouchDB
//to insert text to CouchDB
app.get('/insert', function(req, res, next) {
	sotsu.insert({_id:'Nov-29', data:'hoge'}, function(err, body, header){
		if(!err){
			console.log('text update done');
		}else{
  		console.log('err:' + err);
		}
	});
});


app.listen(3000, function(){
  console.log("Express server listening on http://localhost:3000");
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
