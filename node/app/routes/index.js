var express = require('express');
var router = express.Router();
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', user : req.user });
});

router.get('/login', (req, res) => {
  res.render('login', {user: req.user});
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

router.get('/home', (req, res)=>{
  var query = {
    text: 'SELECT recipe.id, recipe.name FROM cookhack.recipe',
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/');
    }else{
      client.query(query, (err, result) => {
        res.render('home', {recipes: result.rows});
      });
    }
  });
});

router.get('/status', function(req, res, next){
  res.render('status');
});

router.get('/search', function(req, res){
  res.render('search');
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
        var description = result.rows[0].description;
        console.log(typeof description);
        description = description.replace(/\\n/g, '\n');
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
    text: 'SELECT * FROM cookhack.Recipe WHERE name %> $1',
    values: [ req.body.searchword ],
  };

  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/');
      return;
    }else{
      client.query(query, function(err, result){
        res.render('search', { recipes: result.rows, search: query });
      });
    }
  });
});

router.post('/menu/:id', (req, res) => {
  var date = new Date();
  var dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
  var query = {
    text: "UPDATE cookhack.userscarbohydrate SET $1 = ($1)+( \
            SELECT sum(food.gram*food.carbohydrate/100) FROM cookhack.recipe \
            RIGHT JOIN( \
              SELECT finr.recipe_id, fstuff.carbohydrate, finr.gram \
              FROM cookhack.foodstuffincludedrecipe as finr \
              LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
            ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $2 \
          ) WHERE userid = 'Tanya'; \
          UPDATE cookhack.usersprotein SET $1 = ($1)+( \
            SELECT sum(food.gram*food.protein/100) FROM cookhack.recipe \
            RIGHT JOIN( \
              SELECT finr.recipe_id, fstuff.protein, finr.gram \
              FROM cookhack.foodstuffincludedrecipe as finr \
              LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
            ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $2 \
          ) WHERE userid = 'Tanya'; \
          UPDATE cookhack.userslipid SET $1 = ($1)+( \
            SELECT sum(food.gram*food.lipid/100) FROM cookhack.recipe \
            RIGHT JOIN( \
              SELECT finr.recipe_id, fstuff.lipid, finr.gram \
              FROM cookhack.foodstuffincludedrecipe as finr \
              LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id \
            ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $2 \
          ) WHERE userid = 'Tanya'; ",
    values: [ dayOfWeek, req.param.id,/*, req.user */],
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/menu/'+req.param.id);
    }else{
      client.query(query,(err, result)=>{
        if(err)console.log(err);
        res.redirect('/status');
      });
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
