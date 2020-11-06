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
        console.log("here");
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
    text: 'SELECT recipe.name as recipe_name, recipe.description, food.name as food_name, food.gram, food.carbohydrate, food.protein, food.lipid FROM cookhack.recipe RIGHT JOIN ( SELECT finr.recipe_id, fstuff.name, fstuff.carbohydrate, fstuff.protein, fstuff.lipid, finr.gram FROM cookhack.foodstuffincludedrecipe as finr LEFT JOIN cookhack.foodstuff as fstuff ON finr.foodstuff_id = fstuff.id ) as food ON recipe.id = food.recipe_id WHERE recipe.id = $1',
    values: [ req.params.id ],
  };
  pool.connect((err, client) => {
    if(err){
      console.log(err);
      res.redirect('/');
      return;
    }else{
      client.query(query, (err, result) => {
        res.render('menu', {data: result.rows});
        console.log(result);
        var recipe_name = new Set();
        result.rows.forEach(column => {
          recipe_name.add(column["recipe_name"]);
        });
        res.render('menu', {data: result.rows, recipe_name: recipe_name});
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
