/* ライブラリの読み込み */
var fs = require('fs');                             // ファイル読み込み(FileStream)
var SparqlClient = require('sparql-client');        // SPARQL 用クライアント

/* 定数定義 */
const Endpoint1 = "http://130.158.76.22:8890/sparql";
const Endpoint2 = "http://130.158.76.30:8890/sparql";

const ViewQueryFilenameProduct = "./viewqueries/product.sparql";
const ViewQueryFilenameFeature= "./viewqueries/feature.sparql";

/* 問合せが終わったかどうかのフラグ */
var isEndProduct = false;
var isEndFeature = false;

/* SPARQL クライアントの作成 */
var sparqlClientProduct = new SparqlClient(Endpoint1);
var sparqlClientFeature = new SparqlClient(Endpoint2);

/* ファイルからビュークエリの読み出し */
var sparqlQueryProduct = fs.readFileSync(ViewQueryFilenameProduct, 'utf-8');
var sparqlQueryFeature = fs.readFileSync(ViewQueryFilenameFeature, 'utf-8');

var resultProduct = {};
var resultFeature = {};

sparqlClientProduct.query(sparqlQueryProduct).execute(function(error, ret) {
  var bindings = ret.results.bindings;
  resultProduct = bindings.map(function(binding) {
    var s = {};
    for (var k in binding) {
      s[k] = binding[k].value;
    }
    return s;
  });
  isEndProduct= true;
  somethingCallback();
  fs.writeFile('outputs/tmp_product.json', JSON.stringify(resultProduct));
});

/* resultFeature に格納 */
sparqlClientFeature.query(sparqlQueryFeature).execute(function(error, ret) {
  var bindings = ret.results.bindings;
  resultFeature = bindings.map(function(binding) {
    var s = {};
    for (var k in binding) {
      s[k] = binding[k].value;
    }
    return s;
  });
  isEndFeature = true;
  somethingCallback();
  fs.writeFile('outputs/tmp_feature.json', JSON.stringify(resultFeature));
});

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

function somethingCallback(){
  if (isEndProduct && isEndFeature) {
    console.log("haireturyo");
    result = hashJOIN(resultProduct, resultFeature, "prdctft","ft");
    fs.writeFile('outputs/output.json', JSON.stringify(result));
  }
};
