/**
 * CostEstmator
 * JOIN順序を返す
 */

/**
 * ライブラリの読み込み
 */
var _ = require('lodash');

/**
 * 統計情報の集合
 */
var stats = [
  {
    id: "p",
    viewname: "product",
    columnsize:
    {
      prdct: 87.35901527239571,
      prdctlbl: 18.921187599726466,
      value1: 2.468742876681103,
      ptype: 67.91043138819239,
      pdate: 16,
      prdctft: 74.32864144062002,
      pd: 86.95264417597447
    },
    timems: 9546,
    rows: 17502,  //values <50
    rowsizeCof: 1.68,
    bandwidthByteps: 10485760
  },
  {
    id: "f",
    viewname: "feature",
    columnsize:
    {
      ft: 74.94419621637037,
      ftlbl: 18.549862154197168 
    },
    timems: 275,
    rows: 10519,
    rowSizeCof: 1.45,
    bandwidthByteps: 10485760
  },
  {
    id: "t",
    viewname: "producttype",
    columnsize:
    {
      pt: 70.67173252279635,
      ptlbl: 18.47112462006079,
      ptdate: 16 
    },
    timems: 60,
    rows: 329,
    rowSizeCof: 2.00,
    bandwidthByteps: 10485760
  },
  {
    id: "r",
    viewname: "producer",
    columnsize:
    { pd: 86.95145631067962,
      pdlbl: 18.41747572815534,
      pdcountry: 45 
    },
    rows: 206,
    rowSizeCof: 1.405,
    bandwidthByteps: 10485760
  },
  {
    id: "o",
    viewname: "offer",
    columnsize:
    { of: 84.3580398916523,
    ofdays: 1.0001026019863744,
    ofdate: 16,
    ofprdct: 87.50430928342773 }
    ,
    timems: 3723,
    rows: 48732,    // ?ofdays > 4
    rowSizeCof: 1.909,
    bandwidthByteps: 10485760
  }
];

/**
 * グローバル変数定義
 */
var leastcost = [];
var bestplan = [];
var rows = [];

const sel = 1; // 今回はrowsをそのまま使う 

/**
 * idを持っている集合を渡すと，
 * 集合に対応する添字を返してくれる
 * @param {Array.JSON} set statsの集合
 * 例)
 * stats.id が [a,c,b] の とき
 * str "acb" を返す．
 */
function getKeyForSet (set) {
  var arr = [];
  for (var i=0; i<set.length; i++) {
    arr.push(set[i].id);
  }
  arr.sort();
  return arr.join("");
}

/**
 * 各部分集合の
 * leastcost[{S}], bestplan[{S}],rows[{S}]
 * を再帰的に(DPで)解く関数．
 * 最終的にほしいのは bestplan[{S}]．
 * @param {Array.JSON} S statsの集合
 */
function FindBestPlanDP(S) {
  if (S.length === 1) {
    return;
  }
  for (var i = 0; i < S.length; i++) {
    var diff = _.difference(S,[S[i]]);
    FindBestPlanDP(diff);
    // FindBestPlanDP([S[i]]);                             // 末端は必ず求まっているのでいらない
    var idxDiff = getKeyForSet(diff);
    var idxSi = getKeyForSet([S[i]]);
    var idxS = getKeyForSet(S);
      
    var JOINCost = (rows[idxDiff]||0) + rows[idxSi];
    const alpha = 0.01;
    var cost = Math.max((leastcost[idxDiff]||0), (leastcost[idxSi]||0)) + alpha*JOINCost;
    if (cost < (leastcost[idxS]||Infinity)) {
      leastcost[idxS] = cost;
      bestplan[idxS] = "("+(bestplan[idxDiff] || "").concat(" join ", (bestplan[idxSi] || ""))+")";
      var VALUECOUNT = 0;
      /*
      if (idxS == "fp") {
        VALUECOUNT = Math.max(49200,10519);
      } else if(idxS == "pt") {
        VALUECOUNT = Math.max(251,329);
      } else if(idxS == "fpt") {
        VALUECOUNT = Math.max(251,329);
      } */
      rows[idxS] = (rows[idxDiff] * rows[idxSi]) / 10000;        // max(V(R,Y),V(S,Y))で割る
    }
  } 
};

/**
 * JOIN順序を求める関数
 * for Si in stats について
 * 配列leastcost[{Si}], bestplan[{Si}],rows[{Si}] を初期化し，
 * FindBestPlanDP(stats) を呼ぶ．
 */
function FindBestPlan() {
  for (var i=0; i<stats.length; i++) {
    var Si = stats[i];
    var idxSi = getKeyForSet([Si]);
    rows[idxSi] = sel * Si.rows;
    bestplan[idxSi] = Si.viewname;
    
    var rowsize = 0;
    for (var x in Si.columnsize) {
      rowsize += Si.rowsizeCof * (Si.columnsize[x] + 5);
    }
    
    leastcost[idxSi] = Si.timems
                       + (rows[idxSi]*rowsize) / Si.bandwidthByteps;
  }
  
  FindBestPlanDP(stats);
  console.log(bestplan[getKeyForSet(stats)])
};

/**
 * メインのロジック
 */
FindBestPlan();