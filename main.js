// ファイル読み込み(FileStream)
var fs = require('fs');
// SPARQL 用クライアント
var SparqlClient = require('sparql-client');

var Endpoint1 = "http://130.158.76.22:8890/sparql";
var Endpoint2 = "http://130.158.76.30:8890/sparql";

var sparqlClientProduct = new SparqlClient(Endpoint1);
var sparqlClientFeature = new SparqlClient(Endpoint2);

var sparqlQueryProduct = fs.readFileSync();
