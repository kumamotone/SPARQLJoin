/*
 *  
 */
function hashJOIN(R,S,X,Y) {
  var result = [];
  var hashtable = {};
  if (R.length > S.length) {
    var tmp;
    tmp = R;
    R = S;
    S = tmp;
    
    tmp = X;
    X = Y;
    Y = tmp;
  }

  /* build phase */
  for (var i = 0; i < R.length; i++) {
    if(!hashtable[R[i][X]]) {
      hashtable[R[i][X]] = [R[i]]; 
    } else {
      hashtable[R[i][X]].push(R[i]); 
    }
  }

  /* probe phase */
  for (var i = 0; i < S.length; i++) {
    var joinkey = S[i][Y];
    if(hashtable[joinkey]) {
      for (var j = 0; j < hashtable[joinkey].length; j++) {
        var t = {};
        for (var x in hashtable[joinkey][j]) {
          t[x] = hashtable[joinkey][j][x];
        }
        for (var x in S[i]) {
          t[x] = S[i][x];
        }
        result.push(t);
      }
    }
  }
 
  return result;
};

/*
 *
 */
function execQuery(name, conf) {
  conf.client.query(conf.query).execute(function(error, ret) {
    var bindings = ret.results.bindings;
    conf.result = bindings.map(function(binding) {
      var s = {};
      for (var k in binding) {
        s[k] = binding[k].value;
      }
      return s;
    });
    conf.flag = true;
    somethingCallback();
    fs.writeFile('outputs/tmp_'+name+'.json', JSON.stringify(conf.result));
  });
}

/* ライブラリの読み込み */
var fs = require('fs');                             // ファイル読み込み(FileStream)
var SparqlClient = require('sparql-client');        // SPARQL 用クライアント

/* 定数定義 */
const ENDPOINT1 = "http://130.158.76.22:8890/sparql";
const ENDPOINT2 = "http://130.158.76.30:8890/sparql";

var viewconf = {
  product : {
    endpoint : ENDPOINT2,
    filename : "./viewqueries/product.sparql"
  },
  feature : {
    endpoint : ENDPOINT1,
    filename : "./viewqueries/feature.sparql"
  },
  producttype : {
    endpoint : ENDPOINT1,
    filename : "./viewqueries/producttype.sparql"
  }
};

/* 問合せが終わったかどうかのフラグ */
for(var viewname in viewconf) {
  var conf = viewconf[viewname];
  conf.flag = false;
  conf.client = new SparqlClient(conf.endpoint);
  conf.query = fs.readFileSync(conf.filename, 'utf-8');
  execQuery(viewname, conf);
}

function somethingCallback(){
  if (viewconf.product.flag && viewconf.feature.flag) {
    console.log("haitteruyo");
    var finalresult = hashJOIN(viewconf.product.result, viewconf.feature.result, "prdctft","ft");
    fs.writeFile('outputs/output.json', JSON.stringify(finalresult));
  }
};
