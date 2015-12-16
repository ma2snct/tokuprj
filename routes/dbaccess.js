var app = module.parent.exports

var nano = require('nano')('http://localhost:5984')
  ,db = require('nano')('http://localhost:5984/sotsu')
  ,sotsu = nano.use('sotsu')
  ,fs = require('fs');


//to add 0 if months and dates are the single number;
var toDoubleDigits = function(num){
  num += "";
  if(num.length === 1) num = "0" + num;
  return num;
}

//for parse
var csv = require('ya-csv');
var reader = csv.createCsvFileReader('./public/static/test.csv', {
  'separator': ',',
  'quote': '"',
  'escape': '"',
  'comment': '',
});

//to insert vartical csv file to CouchDB with parse
//検査データのときに使う
exports.parse = function(req, res, next) {

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
//投薬データのときに使う
exports.horizontialparse = function(req, res, next) {

  var in_data={};
  var list = [];
  var category=[];
  var i=0;
  reader.addListener('data', function (data) {
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
    	  sotsu.insert({_id:"ryuji"/*req.user.username*/+m+(d+1)+"-"+k, data:list[k]}, function(err, body, header){
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
	,rs = fs.createReadStream('./public/static/obxonly.txt')
	,readline = require('readline');

  var rl = readline.createInterface(rs, {});

  //todo タグを充実させる
  var tags = {"RXE":"薬剤/処置 コード化されたオーダ",
			"NTE":"注釈・コメント",
			"TQ1":"タイミング/数量"
			};

  //todo RXEタグ以外にも対応させる
  var childtags = {
    "RXE-0":"セグメントID",
    "RXE-1":"数量/タイミング",
    "RXE-2":"与薬コード",
    "RXE-3":"与薬量－最小",
    "RXE-4":"与薬量－最大",
    "RXE-5":"与薬単位",
    "RXE-6":"与薬剤形",
    "RXE-7":"依頼者の投薬指示"
  };

  var OBXtags = {
    "OBX-0" : "セグメント ID",
    "OBX-1" : "セット ID - OBX",
    "OBX-2" : "値型",
    "OBX-3" : "検査項目",
    "OBX-4" : "検査副 ID",
    "OBX-5" : "検査値",
    "OBX-6" : "単位"
  }



  var in_data = {};

  //whenever input line for RXE
  /*
  rl.on('line', function(line){
  	var tag = line.substr(0,3);
    var i=0;
    for(t in childtags){

      var n=line.indexOf("|")

      in_data[childtags[t]]=line.substr(0,n);
      line = line.substr(n+1);
      i++;

      console.log(in_data);
    }
  });
  */

  //whenever input line for OBX
  rl.on('line', function(line){
    var tag = line.substr(0,3);
    var i=0;
    for(t in OBXtags){

      var n=line.indexOf("|")

      in_data[OBXtags[t]]=line.substr(0,n);
      line = line.substr(n+1);
      i++;

      console.log(in_data);
    }
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
  //res.send(in_data);

};


//to get all data which is sellected key
exports.getdb =  function(req, res, next) {
  var out = [];
  //var keyword = "薬";
  //var regexp = /keyword+/;
  var regexp = /薬+/;

  //todo ループの範囲を適当に
  //ryujiの12月のドキュメントに対して
  for(var i=9; i<26; i++){
    var d = toDoubleDigits(i);
  	sotsu.get("ryuji"/*req.user.username*/+'12'+d, function(err, body, header){
  		if(!err){
        //dataタグに格納されているデータ群だけを変数に入れる
        var data = body.data;

        //その日のドキュメント内のdataがもつkey-valueの
        //組の数だけループ
        for(key in data){
          //検索ワードに一致したら
          if(key.match(regexp)){
            out.push(data[key]);
            //ドキュメント名とkey-valueを表示する
            console.log(body._id + ":" + key + "->" + data[key]);
          }
          i++;
        }
  		}else{
    		console.log('err:' + err);
  		}
  	});

    if(i>24){
      console.log("---out---" + out);
      res.send('ok');

    }
  }
};
