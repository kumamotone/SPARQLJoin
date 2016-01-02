/**
 * ConfirmJoinResult
 * main.js での JOIN結果が正しいか確認する
 */

/**
 * 2つのリレーションをハッシュ結合する
 * @param {Array.JSON} リレーション R
 * @param {Array.JSON} リレーション S
 * @param {string} X リレーション R の結合キー
 * @param {string} Y リレーション S の結合キー
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

/**
 * ライブラリの読み込み
 */
var fs = require('fs');                             // ファイル読み込み(FileStream)

var p = fs.readFileSync("outputs/tmp_product.json", 'utf-8');
var f= fs.readFileSync("outputs/tmp_feature.json", 'utf-8');
var pt= fs.readFileSync("outputs/tmp_producttype.json", 'utf-8');

var jsonp = JSON.parse(p);
var jsonf = JSON.parse(f);
var jsonpt = JSON.parse(pt);

result = hashJOIN(jsonp, jsonf, "prdctft","ft");
result = hashJOIN(result, jsonpt, "ptype","pt");
fs.writeFile('outputs/output2.json', JSON.stringify(result));
