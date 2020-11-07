var express = require('express');
var router = express.Router();
var flash = require('connect-flash');
var request = require('request');
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4');
const pg = require('pg');
const fs = require('fs');
const passport = require('passport');
const { database } = require('pg/lib/defaults');

const pool = new pg.Pool({
  database: 'cookhack',
  user: 'root',
  password: 'password',
  host: 'db',
  port: 5432,
});

function ensureAuthentication(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect("/login");
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/home');
});

router.get('/join', function(req, res, next) {
  res.render('join', {
    title: "Join",
    userData: req.user,
    messages: {
      danger: req.flash('danger'),
      warning: req.flash('warning'),
      success: req.flash('success')
    }
  })
})

router.post('/join', async function (req, res) {
  try {
    const client = await pool.connect()
    await client.query('BEGIN')
    var pwd = await bcrypt.hash(req.body.password, 5);
    await JSON.stringify(
      client.query('SELECT userid FROM cookhack.User WHERE "email"=$1', [req.body.email], function(err, result) {
        if (result && result.rows[0]) {
          req.flash('warning', "This email address is already registered. <a href='/login'>Log in!</a>")
          res.redirect('/join');
        } else {
          client.query(
            "INSERT INTO cookhack.User (userid, name, email, password) VALUES ($1, $2, $3, $4)",
            [uuidv4(), req.body.username, req.body.email, pwd],
            function (err, result) {
              if (err) {
                console.log(err);
                client.query('ROLLBACK');
              } else {
                client.query('COMMIT');
                console.log(result)
                req.flash('success', 'User created')
                res.redirect('/login');
              }
            }
          );
          client.query("INSERT INTO cookhack.UsersCarbohydrate (userid, sunday, monday, tuesday, wednesday, thursday, friday, saturday) VALUES \
                  ( (SELECT userid from cookhack.User where email = $1),      0,      0,       0,         0,        0,      0,        0)",
            [req.body.email]
          );
          client.query("INSERT INTO cookhack.UsersProtein      (userid, sunday, monday, tuesday, wednesday, thursday, friday, saturday) VALUES \
                  ( (SELECT userid from cookhack.User where email = $1),      0,      0,       0,         0,        0,      0,        0)",
            [req.body.email]
          );
          client.query("INSERT INTO cookhack.UsersLipid        (userid, sunday, monday, tuesday, wednesday, thursday, friday, saturday) VALUES \
                  ( (SELECT userid from cookhack.User where email = $1),      0,      0,       0,         0,        0,      0,        0)",
            [req.body.email]
          );
          return;
        }
      })
    )
    client.release();
  } catch (e) {
    throw(e);
  }
})

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) res.redirect('/home');
  else {
    res.render('login', {
      title: "Log in",
      userData: req.user,
      messages: {
        danger: req.flash('danger'),
        warning: req.flash('warning'),
        success: req.flash('success')
      }
    });
  }
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}), function(res, req) {
  if (req.body.remember) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  } else {
    req.session.cookie.expires = false;
  }
  res.redirect('/home');
})

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', "Logged out. See you soon!");
  res.redirect('/login');
});

router.get('/home', ensureAuthentication, (req, res)=>{
  var query = {
    text: 'SELECT recipe.id, recipe.name FROM cookhack.recipe',
    
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/login');
    }else{
      client.query(query, (err, result) => {
        console.log("here");
        console.log(req.user)
        console.log(result.rows)
        res.render('home', {recipes: result.rows, user: req.user});
      });
    }
  });
});

router.get('/status', ensureAuthentication, function(req, res, next){
  var query = {
    text: "SELECT u.name, \
                  (carb.sunday+carb.monday+carb.tuesday+carb.wednesday+carb.thursday+carb.friday+carb.saturday) as carb_sum,\
                  carb.sunday as carb_sun, carb.monday as carb_mon, carb.tuesday as carb_tue, carb.wednesday as carb_wed, carb.thursday as carb_thu, carb.friday as carb_fri, carb.saturday as carb_sat, \
                  (prot.sunday+prot.monday+prot.tuesday+prot.wednesday+prot.thursday+prot.friday+prot.saturday) as prot_sum,\
                  prot.sunday as prot_sun, prot.monday as prot_mon, prot.tuesday as prot_tue, prot.wednesday as prot_wed, prot.thursday as prot_thu, prot.friday as prot_fri, prot.saturday as prot_sat, \
                  (lipid.sunday+lipid.monday+lipid.tuesday+lipid.wednesday+lipid.thursday+lipid.friday+lipid.saturday) as lipid_sum,\
                  lipid.sunday as lipid_sun, lipid.monday as lipid_mon, lipid.tuesday as lipid_tue, lipid.wednesday as lipid_wed, lipid.thursday as lipid_thu, lipid.friday as lipid_fri, lipid.saturday as lipid_sat \
          FROM cookhack.user as u\
          LEFT JOIN cookhack.userscarbohydrate as carb ON u.userid = carb.userid\
          LEFT JOIN cookhack.usersprotein as prot ON u.userid = prot.userid\
          LEFT JOIN cookhack.userslipid as lipid ON u.userid = lipid.userid\
          WHERE u.email = $1 ",
    values: [ req.user.email ]
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/');
      return;
    }
    client.query(query, (err, result) => {
      if(err)console.log(err);
      res.render('status',{user_data: result.rows[0]});
    });
  });
});

router.get('/search', function(req, res){
  res.render('search', { recipes: undefined, search: undefined });
});

router.get('/menu/:id', function(req, res){
  console.log(req.params.id);
  var query = {
    text: 'SELECT recipe.name as recipe_name, recipe.description, food.name as food_name, food.gram, food.carbohydrate, food.protein, food.lipid FROM cookhack.recipe \
          RIGHT JOIN ( \
            SELECT finr.recipe_id, fstuff.name, fstuff.carbohydrate, fstuff.protein, fstuff.lipid, finr.gram \
            FROM cookhack.foodstuffincludedrecipe as finr \
            LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
          ) as food ON recipe.id = food.recipe_id \
          WHERE recipe.id = $1',
    values: [ req.params.id ],
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/');
      return;
    }else{
      client.query(query, (err, result) => {
        var description = result.rows[0].description.split('\\n');
        //description = description.replace(/\\n/g, '\n');
        res.render('menu', { request_id: req.params.id, recipe_data: result.rows, menu: result.rows[0].recipe_name, description: description });
      });
    }
  });
});

router.get('/init', function(req, res){
  res.render('init');
});


/* POST */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  session: true
}));

router.post('/search', (req, res) => {
  var query = {
    text: 'SELECT recipe.id, recipe.name, recipe.description, food.carbohydrate, food.protein, food.lipid, food.gram FROM cookhack.Recipe \
    RIGHT JOIN ( \
      SELECT finr.recipe_id, fstuff.carbohydrate, fstuff.protein, fstuff.lipid, finr.gram \
      FROM cookhack.foodstuffincludedrecipe as finr \
      LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
    ) as food ON recipe.id = food.recipe_id WHERE recipe.name = $1',
    values: [ req.body.searchword ],
  };

  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/');
      return;
    }else{
      client.query(query, function(err, result){
        if(err)console.log(err);
        var recipe_id_set = new Set();
        var recipe_set = new Array();
        var carbohydrate = {};
        var protein = {};
        var lipid = {};
        result.rows.forEach(row => {
          if(!(recipe_id_set.has(row.id))){
            recipe_id_set.add(row.id);
            recipe_set.push({id: row.id, name: row.name, description: row.description.replace(/\\n/g, '\n')});
            carbohydrate[row.id] = 0.0;
            protein[row.id] = 0.0;
            lipid[row.id] = 0.0;
          }
          carbohydrate[row.id] += row.carbohydrate*row.gram/100;
          protein[row.id] += row.protein*row.gram/100;
          lipid[row.id] += row.lipid*row.gram/100;
        });
        console.log(carbohydrate);
        res.render('search', { recipes: result.rows, recipe_set: recipe_set, search: query, carbohydrate: carbohydrate, protein: protein, lipid: lipid});
      });
    }
  });
});

router.post('/menu/:id', ensureAuthentication, (req, res) => {
  var date = new Date();
  var dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
  var query = {
    text: "UPDATE cookhack.userscarbohydrate SET "+ dayOfWeek +" = "+ dayOfWeek +"+( \
            SELECT sum(food.gram*food.carbohydrate/100) FROM cookhack.recipe \
            RIGHT JOIN( \
              SELECT finr.recipe_id, fstuff.carbohydrate, finr.gram \
              FROM cookhack.foodstuffincludedrecipe as finr \
              LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
            ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $1 \
          ) WHERE userid = (\
            SELECT userid from cookhack.User where email = $2\
          )",
    values: [ req.params.id, req.user.email ],
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/menu/'+req.params.id);
    }else{
      client.query(query,(err, result)=>{
        if(err)console.log(err);
      });
      client.query(
        "UPDATE cookhack.usersprotein SET "+ dayOfWeek +" = "+ dayOfWeek +"+( \
          SELECT sum(food.gram*food.protein/100) FROM cookhack.recipe \
          RIGHT JOIN( \
            SELECT finr.recipe_id, fstuff.protein, finr.gram \
            FROM cookhack.foodstuffincludedrecipe as finr \
            LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
          ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $1 \
        ) WHERE userid = (\
          SELECT userid from cookhack.User where email = $2\
        )",
        [ req.params.id, req.user.email ],
        (err, result) => {
          if(err)console.log(err);
        }
      );
      client.query(
        "UPDATE cookhack.userslipid SET "+ dayOfWeek +" = "+ dayOfWeek +"+( \
          SELECT sum(food.gram*food.lipid/100) FROM cookhack.recipe \
          RIGHT JOIN( \
            SELECT finr.recipe_id, fstuff.lipid, finr.gram \
            FROM cookhack.foodstuffincludedrecipe as finr \
            LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
          ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $1 \
        ) WHERE userid = (\
          SELECT userid from cookhack.User where email = $2\
        )",
        [ req.params.id, req.user.email ],
        (err, result) => {
          if(err)console.log(err);
        }
      );
      res.redirect('/status');
    }
  });
});

/* init_data */
router.post('/init_table', function(req, res){
  fs.readFile('/app/sql/00_init_database.sql','utf-8', (err,data)=>{
    if(err) {
      console.log(err);
      res.redirect('/init');
      return;
    }
    var query ={
      text:data,
    }
    pool.connect((err, client)=>{
      if(err){
        console.log(err);
      }else{
        client.query(query)
        .then(()=>{
          console.log('fin');
          res.redirect('/init');
        });
      }
    });
  });
});

router.post('/init_data', function(req,res){
  fs.readFile('/app/sql/01_insert_sample_data.sql', 'utf-8', (err,data)=>{
    if(err) {
      console.log(err);
      res.redirect('/init');
      return;
    }
    var query ={
      text:data,
    }
    pool.connect((err, client)=>{
      if(err){
        console.log(err);
      }else{
        client.query(query)
        .then(()=>{
          console.log('fin');
          res.redirect('/init');
        });
      }
    });
  });
});


module.exports = router;
