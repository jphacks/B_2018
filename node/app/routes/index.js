var express = require('express');
var router = express.Router();
const pg = require('pg');

const pool = new pg.Pool({
  database: 'cookhack',
  user: 'root',
  password: 'password',
  host: 'localhost',
  port: 5432,
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/home', function(req, res, next){
  res.render('home');
});

router.get('/status', function(req, res, next){
  res.render('status');
});

router.get('/search', function(req, res){
  res.render('search');
});

router.get('/menu/:id', function(req, res){
  console.log(req.params.id);
  res.render('menu');
});


/* POST */


module.exports = router;
