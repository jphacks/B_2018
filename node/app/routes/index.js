var express = require('express');
var router = express.Router();
const pg = require('pg');
const fs = require('fs');
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
/*router.post('/', function(req, res){
  connection.query(
    'SELECT * FROM cookhack.Recipe WHERE name = ?',
    [ req.body.searchword ],
    (error, results) => {
      res.render('search', { recipes: results });
    }
  );
  //res.render('search');
});*/

router.post('/search', (req, res) => {
  var query = { 
    text: 'SELECT * FROM cookhack.Recipe WHERE name = ?',
    values: [ req.body.searchword ],
  };
  
  pool.connect()//(err, client) => {
  .then(() => pool.query(query))
  .then(results => res.render('search', { recipes: results }))
  /*  if(err){
      console.log(err);
    }else{
      client.query(query)
      .then(results =>
        res.render('search', { recipes: results});
      );
    }
  }*/
  /*connection.query(
    'SELECT * FROM cookhack.Recipe WHERE name = ?',
    [ req.body.searchword ],
    (error, results) => {
      res.render('search', { recipes: results });
    }
  );*/
  //res.render('search');
});

/* init_data */
router.post('/init', function(req, res){
  fs.readFile('/app/sql/00_init_database.sql','utf-8', (err,data)=>{
    if(err) {
      console.log(err);
      res.redirect('/');
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
          res.redirect('/');
        });
      }
    });
  });
});

router.post('/init_data', function(req,res){
  fs.readFile('/app/sql/01_insert_sample_data.sql', 'utf-8', (err,data)=>{
    if(err) {
      console.log(err);
      res.redirect('/');
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
          res.redirect('/');
        });
      }
    });
  });
});


module.exports = router;
