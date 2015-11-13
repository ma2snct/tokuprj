var express = require('express');
var router = express.Router();

//DB設定
//ローカル
var nano = require('nano')('http://localhost:5984');
var db = require('nano')('http://localhost:5984/sotsu');
var sotsu = nano.use('sotsu');

//cloudant
/* _writer access is required for this request ってエラーで書き込めてない
var nano = require('nano')('https://ma2snct.cloudant.com/');
var db = require('nano')('https://ma2snct.cloudant.com/tokuron');
var tokuron = nano.use('tokuron');
*/


/* GET home page. */
router.get('/', function(req, res, next) {
  //cloudantと接続できているかチェック
  /*
  db.get('sample', function(err, body){
    console.log(body);
  });
  res.render('index', { title: 'Express' });
  */
  //sotsu.insert({crazy:false}, 'father', function(err, body, header){
  tokuron.insert({crazy:false}, 'father', function(err, body, header){
	   if(err){
	      console.log('[sotsu.insert]', err.message);
        return;
      }
      //console.log('you have inserted the rabbit.');
      console.log(body);
    });
});

module.exports = router;
