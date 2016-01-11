/**
 * CostEstmator
 * JOIN順序を返す
 */

/**
 * ライブラリの読み込み
 */
var _ = require('lodash');

/* 実験用変数 */
var isINCLSPEED = true; 

/**
 * 統計情報の集合
 */
var stats =   [
  {
    id: "p",
    viewname: "product",
    valuecount: 
    {
      "f": 5573,
      "o": 641,
      "r": 641,
    },
    timems: 1000,
    rawsizeKB : 18000,
    rows: 26698,  //values <50
    bandwidthKByteps: 50000
  },
  {
    id: "f",
    viewname: "feature",
    valuecount: 
    {
      "p": 10519
    },
    timems: 500,
    rawsizeKB: 7900,
    rows: 10519,
    bandwidthKByteps: 2000
  },
  {
    id: "o",
    viewname: "offer",
    valuecount:
    {
      "p": 9505
    },
    timems: 1000,
    rawsizeKB: 9100,
    rows: 16814,    // ?ofdays > 5
    bandwidthKByteps: 50000
  },
  // {
  //   id: "t",
  //   viewname: "producttype",
  //   columnsize:
  //   {
  //     pt: 70.67173252279635,
  //     ptlbl: 18.47112462006079,
  //     ptdate: 16 
  //   },
  //   valuecount: 
  //   {
  //     "p": 329,
  //   },
  //   timems: 60, 
  //   rows: 329,
  //   rowSizeCof: 2.00,
  //   bandwidthKByteps: 1048576
  //   },
  // {
  //   id: "d",
  //   viewname: "producer",
  //   columnsize:
  //   { pd: 86.95145631067962,
  //     pdlbl: 18.41747572815534,
  //     pdcountry: 45 
  //   },
  //   valuecount:
  //   {
  //     "p": 206
  //   },
  //   timems: 50,
  //   rows: 206,
  //   rowSizeCof: 1.405,
  //   bandwidthKByteps: 1048576
  // },
//   {
//    id: "r",
//    viewname: "review",
//    valuecount:
//    {
//      "p": 9430,
//      //"n": 4724
//    },
//    timems: 3000,
//    rawsize: 32862781,
//    rows: 49217,
//    bandwidthKByteps: 50485760
//  },
    
//     {
//     id: "n",
//     viewname: "person",
//     columnsize:
// { name: 12.776754214033712, prsn: 88.90043120344963 }
//     ,
//     valuecount:
//     {
//       "r": 5102
//     },
//     timems: 201,
//     rows: 5102,
//     rowSizeCof: 1.36, //x
//     bandwidthKByteps: 304857
//   },
//     {
//     id: "v",
//     viewname: "vendor",
//     columnsize:
// { vndrlbl: 19.606060606060606, vndr: 81.81818181818181 }
//     ,
//     valuecount:
//     {
//       "o": 99
//     },
//     timems: 20,
//     rows: 99,
//     rowSizeCof: 1.78, //x
//     bandwidthKByteps: 1048576
//   },
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
                  console.log(idxDiff+ " VS " + S[i].id + ":" + VALUECOUNT);
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
      if(idxS.length === 4) {
        console.log("leastcost["+ idxS + "]" + leastcost[idxS]);
      }
      // VALUECOUNT = Math.max(S[i].valuecount[idxDiff], S[idxDiff].valecount[i]);
      if (VALUECOUNT === 0) {
        rows[idxS] = Infinity;
      } else {
        rows[idxS] = (rows[idxDiff] * rows[idxSi]) / VALUECOUNT;        // max(V(R,Y),V(S,Y))で割る
      }
      console.log("rows["+idxDiff+"]:  " +rows[idxDiff]);
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
    /*
    var rowsize = 0;
    for (var x in Si.columnsize) {
      rowsize += Si.rowSizeCof * (Si.columnsize[x] + 5);
    }
    */
    
    if (isINCLSPEED) {    
      leastcost[idxSi] = Si.timems + (Si.rawsizeKB*1000 / Si.bandwidthKByteps);
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
