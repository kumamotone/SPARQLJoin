/** 
 * SPARQLJoin メイン
 * joinplan の順に，
 * SPARQLエンドポイントが返した JSON を
 * JOIN していくプログラム
 */

/**
 * ライブラリの読み込み
 */
var fs = require('fs');                             // ファイル読み込み(FileStream)
var SparqlClient = require('sparql-client');        // SPARQL 用クライアント

/**
 * 定数定義
 */
const ENDPOINT22 = "http://130.158.76.22:8890/sparql";
const ENDPOINT30 = "http://130.158.76.30:8890/sparql";

/**
 * グローバル変数定義
 */
var result;       // 最終的な結果を格納

/**
 * ビュー情報
 */
var viewinfo = {
  // 実装の都合上，JOIN順序を表す要素 dokomade (0→1→2→…と実行されていく)
  // をここで定義している
  // producer : {
  //   endpoint : ENDPOINT30,
  //   filename : "./viewqueries/producer.sparql",
  //   dokomade : 4 
  // },
  product : {
    endpoint : ENDPOINT30,
    filename : "./viewqueries/product.sparql",
    dokomade : 0 
  },
  // producttype : {
  //   endpoint : ENDPOINT30,
  //   filename : "./viewqueries/producttype.sparql",
  //   dokomade : 5 
  // },
  feature : {
    endpoint : ENDPOINT22,
    filename : "./viewqueries/feature.sparql",
    dokomade : 0 
  },
  // offer: {
  //   endpoint : ENDPOINT30,
  //   filename : "./viewqueries/offer.sparql",
  //   dokomade : 1 
  // },
  review: {
    endpoint : ENDPOINT30,
    filename : "./viewqueries/review.sparql",
    dokomade : 1 
  }
  ,
  // person: {
  // endpoint : ENDPOINT22,
  // filename : "./viewqueries/person.sparql",
  // dokomade :3  
  // },
  //   
  // vendor: {
  //    endpoint : ENDPOINT30,
  //    filename : "./viewqueries/vendor.sparql",
  //    dokomade : 0 
  //    }
};

var create_plan = function(ovn, ok, ivn, ik) {
  return {
    outer_viewname: ovn,
    outer_key: ok,
    inner_viewname: ivn,
    inner_key: ik
  }
};

/**
 * JOINプラン定義
 */
var joinplan = [
  // joinplan[0]→joinplan[1] ... の順に leftdeepで結合する
  // create_plan("offer", "ofvndr", "vendor", "vndr"),
  create_plan("review", "rvwfr","product", "prdct"),
  create_plan("product", "prdctft", "feature", "ft"),
  // create_plan("offer", "ofprdct","product", "prdct"),
  // create_plan("review", "rvwprsn","person", "prsn"),
  // create_plan("product", "pd", "producer", "pd"),
  // create_plan("product", "ptype", "producttype", "pt"),

  /*,
    {
    outer_viewname: "review",
    outer_key: "rvwprsn",
    inner_viewname: "person",
    inner_key: "prsn"
    }
    ,
    {
    outer_viewname: "offer",
    outer_key: "ofvndr",
    inner_viewname: "vendor",
    inner_key: "vndr"
    }*/
  ]

  /**
   * 2つのリレーションをハッシュ結合する
   * @param {Array.JSON} R リレーション
   * @param {Array.JSON} S リレーション
   * @param {string} X リレーションR の結合キー
   * @param {string} Y リレーションS の結合キー
   */
  function hashJOIN(R,S,X,Y) {
    console.time("Join");
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
    console.log("R.length: " + R.length +  "\tS.length: " + S.length);
    console.timeEnd("Join");
    console.log(); 
    return result;
  };

/*

   function NLJ(R,S,X,Y) {
// NLJ
console.time("Join");
var result = [];
for(var i=0; i<R.length; i++) {
for(var j=0; j<S.length; j++) {
if (R[i][X] === S[j][Y]) {
var t = {};
for (var element in R[i]) {
t[element] = R[i][element];
}
for (var element in S[j]) {
t[element] = S[j][element];
}
result.push(t);
}
}
}
console.log("R.length: " + R.length +  "\tS.length: " + S.length);
console.timeEnd("Join");
console.log();
return result;
}
*/
/**
 * info に基づいてクエリの実行，info.result に結果のJSON配列を返す
 * @param {string} name ビューの名前(viewinfo[name])
 * @param {JSON} info クエリに関する情報
 */
function execQuery(name, info) {
  info.client.query(info.query).execute(function(error, ret) {
    //fs.writeFile('outputs/tmp_'+name+'_raw.json', JSON.stringify(ret));
    var bindings = ret.results.bindings;
    var t = 0;
    info.result = bindings.map(function(binding) {
      var s = {};
      for (var k in binding) {
        s[k] = binding[k].value;
      }
      t++;
      return s;
    });
    info.flag = true;
    console.log(name+":"+t+"tuples");
    console.timeEnd(name);
    joinCallBack(info.dokomade);
    //fs.writeFile('outputs/tmp_'+name+'.json', JSON.stringify(info.result));
  });
}

/**
 * execQuery が結果を返したら呼ばれるコールバック
 * @param {int} dokomade この番号までをJOINする
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
      // fs.writeFile('outputs/output.json', JSON.stringify(result));
      console.timeEnd("hoge");
    } else {
      joinCallBack(dokomade+1);
    }
  }
};

console.time("hoge");
/**
 * メインのロジック
 */
for(var viewname in viewinfo) {
  var info = viewinfo[viewname];
  info.flag = false;
  info.client = new SparqlClient(info.endpoint);
  info.query = fs.readFileSync(info.filename, 'utf-8');
  console.time(viewname);
  execQuery(viewname, info);
}
