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
  ,assert = require('assert')

//routing
  ,con = require('./routes/confirm.js')
  ,dbaccess = require('./routes/dbaccess.js');



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
        //cb(null, file.originalname + '-' + Date.now())
        cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

//var app = express();
var app = module.exports = express();
//var sotsu = module.exports = nano.use('sotsu')

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
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


app.post('/confirm', con.confirm);


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
//app.get('/insert-file', ensureAuthenticated, dbaccess.insertfile);


//to insert csv file to CouchDB with parse
app.post('/parse', ensureAuthenticated, dbaccess.parse);

app.post('/horizontialparse', /*ensureAuthenticated,*/ dbaccess.horizontialparse)

//to insert HL7 text file to CouchDB with json
app.post('/parsehl7', ensureAuthenticated,dbaccess.parsehl7);


//to insert text to CouchDB at the first time
app.get('/insert', ensureAuthenticated, function(req, res, next) {
	sotsu.insert({_id:req.user.username, data:'hoge1'}, function(err, body, header){
		if(!err){
      res.send(body._id);
      //res.redirect('/account');
    }else{
  		console.log('err:' + err);
		}
	});
});

//to update docment
app.get('/insert2', ensureAuthenticated, function(req, res, next) {
  var doc;

  sotsu.get(req.user.username, function(err, body, header){
    if(!err){
      doc=body;
      //console.log(doc);
	     sotsu.insert({_id:req.user.username, _rev:doc._rev, data:'hoge2'}, function(err, body, header){
         if(!err){
           res.send(body._id);
        }else{
  		    console.log('err:' + err);
		    }
      });
    }
	});
});

//to get document from CouchDB
app.get('/get', function(req, res, next) {
	sotsu.get('ryuji', function(err, body, header){
		if(!err){
      var j = body.data.日時;
      res.send(j);
		}else{
  		console.log('err:' + err);
		}
	});
});

//to get all of ryuji"s data.血糖
app.post('/getdb', ensureAuthenticated, dbaccess.getdb);

app.listen(3000, function(){
  console.log("Express server listening on http://localhost:3000");
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
