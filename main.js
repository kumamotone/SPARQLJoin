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
  

function somethingCallback(){
  if (isEndProduct && isEndFeature) {
    var result = [];
    console.log("haireturyo");
    // join 処理
    for (var i = 0; i < resultProduct.length; i++) {
      for (var j = 0; j < resultFeature.length; j++) {
        if(resultProduct[i].prdctft === resultFeature[j].ft) {
          var t = {};
          for (var x in resultProduct[i]) {
            t[x] = resultProduct[i][x];
          }
          for (var x in resultFeature[j]) {
            t[x] = resultFeature[j][x];
          }
          delete t.ft;
          result.push(t);
        }
      }
    }
    fs.writeFile('outputs/output.json', JSON.stringify(result));
  }
};
