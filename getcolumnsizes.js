/*
 * GetColumnSizes
 * input: SPARQL問合せ結果 json ファイル
 * output: 各列の平均文字数
 */

/* ライブラリの読み込み */
var fs = require('fs');                             // ファイル読み込み(FileStream)
const FILENAME = "outputs/tmp_product.json";        // SPARQL問合せ結果 json ファイル

var contents = fs.readFileSync(FILENAME, 'utf-8');
var json = JSON.parse(contents);

var rowcount = json.length;
var stats = {};

for (var i=0; i<rowcount; i++) {
  for (var x in json[i]) {
    if (!stats[x]) stats[x] = 0;
    stats[x] += json[i][x].length;
  }
}

for (var x in stats) {
  stats[x] /= rowcount;
}

console.log("各列の平均文字数:")
console.log(stats);