/* ライブラリの読み込み */
var fs = require('fs');                             // ファイル読み込み(FileStream)
var SparqlClient = require('sparql-client');        // SPARQL 用クライアント

/* 定数定義 */
const ENDPOINT22 = "http://130.158.76.22:8890/sparql";
const ENDPOINT30 = "http://130.158.76.30:8890/sparql";

var viewinfo = {
  product : {
    endpoint : ENDPOINT30,
    filename : "./viewqueries/product.sparql",
    dokomade : 0
  },
  feature : {
    endpoint : ENDPOINT22,
    filename : "./viewqueries/feature.sparql",
    dokomade : 0
  },
  producttype : {
    endpoint : ENDPOINT22,
    filename : "./viewqueries/producttype.sparql",
    dokomade : 1
  }
};

var joinplan = [
  {
    outer_viewname: "product",
    outer_key: "prdctft",
    inner_viewname: "feature",
    inner_key: "ft"
  },
  {
    outer_viewname: "product",
    outer_key: "ptype",
    inner_viewname: "producttype",
    inner_key: "pt"
  }
]

/*
 * 2つのリレーションをハッシュ結合する
 * @param {Array.JSON} リレーション R
 * @param {Array.JSON} リレーション S
 * @param {string} X リレーション R の結合キー
 * @param {string} Y リレーション S の結合キー
 */
function hashJOIN(R,S,X,Y) {
  var result = [];
  if (R.length > S.length) {
    var tmp;
    tmp = R;
    R = S;
    S = tmp;
    
    tmp = X;
    X = Y;
    Y = tmp;
  }

  /* build フェーズ */
  var hashtable = {};
  for (var i = 0; i < R.length; i++) {
    if(!hashtable[R[i][X]]) {
      hashtable[R[i][X]] = [R[i]]; 
    } else {
      hashtable[R[i][X]].push(R[i]); 
    }
  }

  /* probe フェーズ */
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
 * @param {string} name ビューの名前(viewinfo[name])
 * @param {JSON} info クエリに関する情報
 */
function execQuery(name, info) {
  info.client.query(info.query).execute(function(error, ret) {
    var bindings = ret.results.bindings;
    info.result = bindings.map(function(binding) {
      var s = {};
      for (var k in binding) {
        s[k] = binding[k].value;
      }
      return s;
    });
    info.flag = true;
    joinCallBack(info.dokomade);
    fs.writeFile('outputs/tmp_'+name+'.json', JSON.stringify(info.result));
  });
}

/* ↓メインのロジック↓ */

/* 問合せが終わったかどうかのフラグ */
for(var viewname in viewinfo) {
  var info = viewinfo[viewname];
  info.flag = false;
  info.client = new SparqlClient(info.endpoint);
  info.query = fs.readFileSync(info.filename, 'utf-8');
  execQuery(viewname, info);
}


var result;

/*
 * 
 */
function joinCallBack(dokomade){
  var outer_info = viewinfo[joinplan[dokomade].outer_viewname];
  var inner_info = viewinfo[joinplan[dokomade].inner_viewname];
  if (outer_info.flag && inner_info.flag) {
    console.log("dokomade:" + dokomade);
    if (dokomade === 0) {
      result = hashJOIN(outer_info.result, inner_info.result, joinplan[dokomade].outer_key, joinplan[dokomade].inner_key);
    } else {
      result = hashJOIN(result, inner_info.result, joinplan[dokomade].outer_key, joinplan[dokomade].inner_key);
    }
    
    if (dokomade+1 === joinplan.length) {
      fs.writeFile('outputs/output.json', JSON.stringify(result));
    } else {
      joinCallBack(dokomade+1);
    }
  }
};
