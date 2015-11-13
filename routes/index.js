var express = require('express');
var router = express.Router();

//DB設定
//ローカル
var nano = require('nano')('http://localhost:5984');
var db = require('nano')('http://localhost:5984/sotsu');
var sotsu = nano.use('sotsu');

//cloudant
// _writer access is required for this request ってエラーで書き込めてない
//読み込みも同様　
/*
var nano = require('nano')('https://ma2snct.cloudant.com/');
var db = require('nano')('https://ma2snct.cloudant.com/tokuron');
var tokuron = nano.use('tokuron');
*/


/* GET home page. */
router.get('/', function(req, res, next) {
  //cloudantと接続できているかチェック

  db.get('father', function(err, body){
    if(err){
      console.log('err'+err);
    }
    console.log(body);
  });


  /*
  //sotsu.insert({crazy:false}, 'father', function(err, body, header){
  tokuron.insert({crazy:false}, 'father', function(err, body, header){
	   if(err){
	      console.log('[sotsu.insert]', err.message);
        return;
      }
      //console.log('you have inserted the rabbit.');
      console.log(body);
    });
    */
    res.render('index', { title: 'Express' });

});

module.exports = router;
