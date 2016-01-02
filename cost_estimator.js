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
    rows: 424684,
    bandwidthByteps: 1048576
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
    bandwidthByteps: 1
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
    bandwidthByteps: 1048576
  }
];

/**
 * グローバル変数定義
 */
var leastcost = [];
var bestplan = [];
var rows = [];

const sel = 0.33;    // 選択条件は 不等号であると仮定し，selectivity は とりあえず1/3とする

/**
 * idを持っている集合を渡すと，
 * 集合に対応する添字を返してくれる
 * @param {Array.JSON} set statsの集合
 * 例)
 * stats.id が [a,c,b] の とき
 * str "acb" を返す．
 */
function getKeyForSet (set) {
  var str = "";
  for (var i=0; i<set.length; i++) {
    str = str.concat(set[i].id);
  }
  return str;
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
    const idxDiff = getKeyForSet(diff);
    const idxSi = getKeyForSet([S[i]]);
    const idxS = getKeyForSet(S);
      
    var JOINCost = rows[idxDiff] || 0 + rows[idxSi];
    var cost = Math.max(leastcost[idxDiff] || 0, leastcost[idxSi]+ JOINCost);
    if (cost < leastcost[idxS] || Infinity) {
      leastcost[idxS] = cost;
      bestplan[idxS] = (bestplan[idxDiff] || "").concat(" join ", (bestplan[idxSi] || ""));
      rows[idxS] = rows[idxDiff] * rows[idxSi] / 3;        // TODO:V(R,Y),V(S,Y)で割る
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
    const idxSi = getKeyForSet([Si]);
    rows[idxSi] = sel * Si.rows;
    bestplan[idxSi] = Si.viewname;
    
    var rowsize = 0;
    for (var x in Si.columnsize) {
      rowsize += Si.columnsize[x];
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