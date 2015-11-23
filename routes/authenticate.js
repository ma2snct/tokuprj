var express = require('express')
  , passport = require('passport')
  , flash = require('connect-flash')
  , util = require('util')
  , HashStrategy = require('../../lib/passport-hash').Strategy;


var users = [
    { id: 1, username: 'bob', /*password: 'secret',*/ email: 'bob@example.com', hash: 'a123bc45d678', status: 'offline' }
  , { id: 2, username: 'joe', /*password: 'birthday',*/ email: 'joe@example.com', hash: '0abc12df345', status: 'unconfirmed' }
];

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

      // Find the user by hash.  If there is no user with the given
      // hash, or the status is not unconfirmed, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUserHash(hash, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.status != 'unconfirmed') { return done(null, false, { message: 'This user already confirmed' }); }
        return done(null, user);
      })
    });
  }
));




var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('ejs', require('ejs-locals'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser('keyboard cat'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session());
  app.use(flash());
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
});


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.get('/confirm/:hash', passport.authenticate('hash', {
  failureRedirect: 'login', failureFlash: true
}), function(req, res) {
  res.redirect('/account');
});

app.get('/logout', ensureAuthenticated, function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000, function(){
  console.log("Express server listening on http://localhost:3000");
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}
