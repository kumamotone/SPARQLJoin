/**
 * CostEstmator
 * JOIN順序を返す
 */

/**
 * ライブラリの読み込み
 */
var _ = require('lodash');

/* 実験用変数 */
var isINCLSPEED = false; 

/**
 * 統計情報の集合
 */
var stats =   [
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
    valuecount: 
    {
      "f": 4489,
      "t": 206,
      "d": 176,
      "o": 416,
      "r": 416,
    },
    timems: 1233,
    rows: 17502,  //values <50
    rowSizeCof: 1.68,
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
    valuecount: 
    {
      "p": 10519
    },
    timems: 275,
    rows: 10519,
    rowSizeCof: 1.45,
    bandwidthByteps: 104857
  },
  {
    id: "o",
    viewname: "offer",
    columnsize:
    {
      of: 84.3580398916523,
      ofdays: 1.0001026019863744,
      ofdate: 16,
      ofprdct: 87.50430928342773
    }
    ,
    valuecount:
    {
      "p": 7100
    },
    timems: 1211,
    rows: 16814,    // ?ofdays > 5
    rowSizeCof: 1.909,
    bandwidthByteps: 1048576
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
    valuecount: 
    {
      "p": 329,
    },
    timems: 60, 
    rows: 329,
    rowSizeCof: 2.00,
    bandwidthByteps: 1048576
    },
  {
    id: "d",
    viewname: "producer",
    columnsize:
    { pd: 86.95145631067962,
      pdlbl: 18.41747572815534,
      pdcountry: 45 
    },
    valuecount:
    {
      "p": 206
    },
    timems: 50,
    rows: 206,
    rowSizeCof: 1.405,
    bandwidthByteps: 1048576
  },
   {
    id: "r",
    viewname: "review",
    columnsize:
    { rating2: 1.0972746896923906,
      rvwfr: 87.50600377765785,
      rvwprsn: 88.89712628170534 }
    ,
    valuecount:
    {
      "p": 7100,
      "n": 4724
    },
    timems: 511,
    rows: 14824,
    rowSizeCof: 1.58,
    bandwidthByteps: 1048576
  },
    
    {
    id: "n",
    viewname: "person",
    columnsize:
{ name: 12.776754214033712, prsn: 88.90043120344963 }
    ,
    valuecount:
    {
      "r": 5102
    },
    timems: 201,
    rows: 5102,
    rowSizeCof: 1.36, //x
    bandwidthByteps: 304857
  },
    {
    id: "v",
    viewname: "vendor",
    columnsize:
{ vndrlbl: 19.606060606060606, vndr: 81.81818181818181 }
    ,
    valuecount:
    {
      "o": 99
    },
    timems: 20,
    rows: 99,
    rowSizeCof: 1.78, //x
    bandwidthByteps: 1048576
  },
];

/**
 * グローバル変数定義
 */
var leastcost = [];
var bestplan = [];
var rows = [];
var valuecounts = {};

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
  if (leastcost[getKeyForSet(S)] !== undefined) {
    return;
  }

  var idxS = getKeyForSet(S);
  rows[idxS] = Infinity;
  for (var i = 0; i < S.length; i++) {
    var diff = _.difference(S,[S[i]]);
    FindBestPlanDP(diff);
    // FindBestPlanDP([S[i]]);                             // 末端は必ず求まっているのでいらない
    var idxDiff = getKeyForSet(diff);
    var idxSi = getKeyForSet([S[i]]);
    
    var JOINCost = (rows[idxDiff]||0) + rows[idxSi];
    const alpha = 0.005;
    var cost = Math.max((leastcost[idxDiff]||0), (leastcost[idxSi]||0)) + alpha*JOINCost;
    if (cost < (leastcost[idxS]||Infinity)) {
      leastcost[idxS] = cost;
      bestplan[idxS] = "("+(bestplan[idxDiff] || "").concat(" join ", (bestplan[idxSi] || ""))+")";
      var VALUECOUNT = 0;
      
            // VALUECOUNTを計算する
            for(var j=0; j<diff.length; j++) {
              for(var vc in diff[j].valuecount) {
                if (vc == S[i].id) {
                  // vc は S[i] の相方
                  VALUECOUNT = Math.max(S[i].valuecount[diff[j].id] , diff[j].valuecount[S[i].id]);
                  // console.log(idxDiff+ " VS " + S[i].id + ":" + VALUECOUNT);
                }
              }
            }
            
/*      if (valuecounts[idxDiff].hasOwnProperty(idxSi)) {
        VALUECOUNT = valuecounts[idxDiff][idxSi];
      }
      for (var x in valuecounts[idxSi]) {
        if (idxDiff.indexOf(x) > -1) {
          VALUECOUNT = Math.max(VALUECOUNT, valuecounts[idxSi][x]);
          break;
        }
      }
      console.log(idxDiff + " " + idxSi + " " + VALUECOUNT);

      var new_valuecount = {};
      for (var x in valuecounts[idxDiff]) {
    	  new_valuecount[x] = valuecounts[idxDiff][x];
      }
      for (var x in valuecounts[idxSi]) {
          if (new_valuecount.hasOwnProperty(x)) {
	      new_valuecount[x] = Math.min(new_valuecount[x], valuecounts[idxSi][x]);
	  } else {
	      new_valuecount[x] = valuecounts[idxSi][x];
	  }
      }
      for (var i = 0; i < idxS.length; ++i) {
        delete new_valuecount[idxS[i]];
      }
      valuecounts[idxS] = new_valuecount;
*/
      if(idxS.length === 5) {
        console.log("leastcost["+ idxS + "]" + leastcost[idxS]);
      }
      // VALUECOUNT = Math.max(S[i].valuecount[idxDiff], S[idxDiff].valecount[i]);
      if (VALUECOUNT === 0) {
        rows[idxS] = Infinity;
      } else {
        rows[idxS] = (rows[idxDiff] * rows[idxSi]) / VALUECOUNT;        // max(V(R,Y),V(S,Y))で割る
      }
      // console.log("rows["+idxDiff+"]:  " +rows[idxDiff]);
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
      rowsize += Si.rowSizeCof * (Si.columnsize[x] + 5);
    }
    
    if (isINCLSPEED) {    
      leastcost[idxSi] = Si.timems + (rows[idxSi]*rowsize)*1000 / Si.bandwidthByteps;
    } else {
      leastcost[idxSi] = Si.timems;;
    }

    valuecounts[idxSi] = Si.valuecount;
    console.log("leastcost["+ idxSi + "]" + leastcost[idxSi]);
  }
  FindBestPlanDP(stats);

  console.log(bestplan[getKeyForSet(stats)]);
  console.log("leastcost[stats]"+ leastcost[getKeyForSet(stats)]);
};

/**
 * メインのロジック
 */
FindBestPlan();
