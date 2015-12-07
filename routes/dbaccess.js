var app = module.parent.exports

var nano = require('nano')('http://localhost:5984')
  ,db = require('nano')('http://localhost:5984/sotsu')
  ,sotsu = nano.use('sotsu')
  ,fs = require('fs');


/*
app.get('/insert-file', ensureAuthenticated, function(req, res, next) {

  fs.readFile('./uploads/sample.csv', function(err, data){
  	if(!err){
  		sotsu.multipart.insert({foo: 'bar' }, [{name: 'sample.csv', data: data, content_type:'text/csv'}], req.user.username, function(err, body){
  			if(!err)
  				res.send('file inserted');
  		});
  	}
  })
});
*/

exports.insertfile = function(req, res, next) {
  var doc;

  sotsu.get(req.user.username, function(err, body, header){
    if(!err){
      doc=body;
      console.log(doc);

      fs.readFile('./uploads/sample.csv', function(err, data){
      	if(!err){
      		sotsu.attachment.insert(req.user.username, 'sample.csv', data, 'text/csv',
          {rev:doc._rev}, function(err, body){
      			if(!err)
      				res.send('attachment inserted ');
      		});
      	}
      });


    }else{
      console.log('err at get: ' + err);
    }
  });

};

//to add 0 if months and dates are the single number;
var toDoubleDigits = function(num){
  num += "";
  if(num.length === 1) num = "0" + num;
  return num;
} 

//to insert csv file to CouchDB with parse
exports.parse = function(req, res, next) {
  //for parse
  var csv = require('ya-csv');
  var reader = csv.createCsvFileReader('./public/static/test.csv', {
    'separator': ',',
    'quote': '"',
    'escape': '"',
    'comment': '',
  });
  var in_data={};
  reader.addListener('data', function (data) {
    in_data[data[0]]=data[1];
  });

  var doc;

  sotsu.get(req.user.username, function(err, body, header){
    if(!err){
      doc=body;

      // making date


      var dt = new Date();
      var m = toDoubleDigits(dt.getMonth()+1);
      var d = toDoubleDigits(dt.getDate());

  	  sotsu.insert({_id:req.user.username+m+d, data:in_data}, function(err, body, header){
        if(!err){
          //res.send(body._id);
        }else{
    		  console.log('err:' + err);
  		  }
      });
    }
  });
  res.send('try to parse');
};
