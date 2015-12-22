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

//CouchDBにドキュメントとして入れる
//引数は患者の名前、データがはいった変数
function dbInsert(name, in_data){
  sotsu.get(name, function(err, body, header){
    if(!err){
      doc=body;

      var dt = new Date();
      var m = toDoubleDigits(dt.getMonth()+1);
      var d = toDoubleDigits(dt.getDate());

      //ドキュメント名は患者の名前に日付が追加される
      //sotsu.insert({_id:name+m+d, data:in_data}, function(err, body, header){
      //デバッグ用　
      sotsu.insert({_id:name + m + d, data:in_data}, function(err, body, header){
        if(!err){
          //res.send(body._id);
        }else{
          console.log('err:' + err);
        }
      });
    }
  });
}


//読み込むファイルがCSVのときにつかう
var csv = require('ya-csv');
var reader = csv.createCsvFileReader('./public/static/HEM_201411.csv', {
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

  dbInsert(req.user.username, in_data);

  res.send('try to parse');
};

//to insert horizontial csv file to CouchDB with parse
//投薬データ,血圧データのときに使う
//行の数だけドキュメントが作られる
exports.horizontialparse = function(req, res, next) {

  //読み込むファイルがCSVのときにつかう
  //todo これを関数の外で使えるようにする
  //現状関数の中にいれとかないと空のドキュメントになる

  var csv = require('ya-csv');
  var reader = csv.createCsvFileReader('./public/static/medicines.csv', {
    'separator': ',',
    'quote': '"',
    'escape': '"',
    'comment': '',
  });



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
    //console.log(list)
    i++;
  });

  var doc;

  dbInsert(req.user.username, in_data);

  res.send('try to horizontial csv file');
};

var tags = {
  //ここに足していけばHL7はよくなっていく
  RXE: {
    "RXE-0":"セグメントID",
    "RXE-1":"数量/タイミング",
    "RXE-2":"与薬コード",
    "RXE-3":"与薬量－最小",
    "RXE-4":"与薬量－最大",
    "RXE-5":"与薬単位",
    "RXE-6":"与薬剤形",
    "RXE-7":"依頼者の投薬指示"
  },

  OBX: {
    "OBX-0" : "セグメント ID",
    "OBX-1" : "セット ID - OBX",
    "OBX-2" : "値型",
    "OBX-3" : "検査項目",
    "OBX-4" : "検査副 ID",
    "OBX-5" : "検査値",
    "OBX-6" : "単位"
  }
}

//to insert hl7 text file to CouchDB
exports.parsehl7 = function(req, res, next){
  var fs = require('fs')
	,rs = fs.createReadStream('./public/static/obxonly.txt')
	,readline = require('readline');

  var rl = readline.createInterface(rs, {});

  var in_data = {};

  //
  rl.on('line', function(line){
    //入力からタグを判別する　このままだとただの文字列
    var tag = line.substr(0,3);
    var i=0;

    //そのタグ名のオブジェクトでループ
    for(t in tags[tag]){

      var n=line.indexOf("|")

      in_data[tags[tag][t]]=line.substr(0,n);
      line = line.substr(n+1);
      i++;

      console.log(in_data);
    }
  });


  dbInsert(req.user.username, in_data);

  res.send('hl7 text parse to json');


};


//to get all data which is sellected key

exports.getdb =  function(req, res, next) {
  var out = [];
  var list = [];
  var keyword = req.body.keyword;
  var regexp = new RegExp(keyword + "+");
  console.log(req.body.keyword);

  //todo ループの範囲を適当に 日付も指定できるようにする
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
            console.log(body._id + ":" + key + "->" + data[key]);
            list.push(body._id + ":" + key + "->" + data[key]);

            //listに検索結果が5件たまったら
            if(list.length>5){
              res.render('getdb', {list:list});
            }

          }
        }
  		}else{
    		//console.log('err:' + err);
  		}
  	});


  }
  //res.render('getdb', {list:list}); //list渡せてるけど入ってない

};
