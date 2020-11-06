var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
const pg = require('pg');

const pool = new pg.Pool({
  database: 'cookhack',
  user: 'root',
  password: 'password',
  host: 'db',
  port: 5432
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ resave:false, saveUninitialized:false, secret: 'password test'}));



app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
  session: false,
}, function(req, username, password, done) {
  loginAttempt();
  async function loginAttempt() {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      var currentAccountsData = await JSON.stringify(
        client.query(
          'SELECT userid, name, email, password FROM cookhack.User WHERE "email"=$1',
          [username],
          function (err, result) {
            if (err) {
              return done(err);
            }
            if (result.rows[0] == null) {
              req.flash('danger', "Oops. Incorrect login details.");
              return done(null, false);
            } else {
              bcrypt.compare(password, result.rows[0].password, function(err, check) {
                if (err) {
                  return done();
                } else if (check) {
                  return done(null, {
                    email: result.rows[0].email,
                    name: result.rows[0].name
                  });
                } else {
                  req.flash('danger', "Oops. Incorrect login details.");
                  return done(null, false);
                }
              });
            }
          }
        )
      )
    } catch (e) {
      throw(e);
    }
  }
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
