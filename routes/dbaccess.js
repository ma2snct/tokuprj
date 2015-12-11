var app = module.parent.exports

var nano = require('nano')('http://localhost:5984')
  ,db = require('nano')('http://localhost:5984/sotsu')
  ,sotsu = nano.use('sotsu')
  ,fs = require('fs');


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

//to insert vartical csv file to CouchDB with parse
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
    //todo data[1]のほうを可変にする
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

//to insert horizontial csv file to CouchDB with parse
exports.horizontialparse = function(req, res, next) {
  //for parse
  var csv = require('ya-csv');
  var reader = csv.createCsvFileReader('./public/static/medicines.csv', {
    'separator': ',',
    'quote': '"',
    'escape': '"',
    'comment': '',
  });
  var in_data={};
  var list = []
  var category=[];
  var i=0;
  reader.addListener('data', function (data) {
    //todo data[1]のほうを可変にする
    //in_data[data[0]]=data[1];
    //console.log(data.length);
    if(i!=0){
      for(var j in data){
        in_data[category[j]]=data[j];
      }
    }else{
      category=data;
      //console.log(category);
    }
    //console.log(in_data)
    list.push(in_data);
    console.log(list)
    i++;
  });



  var doc;

  sotsu.get('ryuji'/*req.user.username*/, function(err, body, header){
    if(!err){
      doc=body;

      // making date
      var dt = new Date();
      var m = toDoubleDigits(dt.getMonth()+1);
      var d = toDoubleDigits(dt.getDate());

      for(var k in list){
    	  sotsu.insert({_id:"ryuji"/*req.user.username*/+m+d+"-"+k, medicine:list[k]}, function(err, body, header){
          if(!err){
            //res.send(body._id);
          }else{
      		  console.log('err:' + err);
    		  }
        });
      }
    }
  });

  res.send('try to horizontial csv file');
};

//to insert hl7 text file to CouchDB
exports.parsehl7 = function(req, res, next){
  var fs = require('fs')
	,rs = fs.createReadStream('./public/static/rxedata.txt')
	,readline = require('readline');

  var rl = readline.createInterface(rs, {});

  //todo タグを充実させる
  var tags = {"RXE":"薬剤/処置 コード化されたオーダ",
			"NTE":"注釈・コメント",
			"TQ1":"タイミング/数量"
			};



  var in_data = {};

  //whenever input line
  rl.on('line', function(line){
  	//console.log(line);
  	var tag = line.substr(0,3);
  	//console.log(tag);
  	in_data[tags[tag]]=line.substr(4);
  	//console.log(in_data);
  });

  sotsu.get(req.user.username, function(err, body, header){
    if(!err){
      doc=body;

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

  res.send('hl7 text parse to json');

};

exports.getdb =  function(req, res, next) {
  var out = [];
  for(var i=10; i<27; i++){
    //var d = toDoubleDigits(i);
  	sotsu.get(req.user.username+'12'+i, function(err, body, header){
  		if(!err){
        out.push(body.data.血糖);
        console.log(out);
  		}else{
    		console.log('err:' + err);
  		}
  	});

    if(i>25){
      res.send('ok');
      console.log(out);
    }
  }
};
