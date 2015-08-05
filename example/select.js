var mysql = require("mysql");
var query = require("..");

var conn = mysql.createConnection({host:"localhost",user:"root",database:"mysql"});

query.setDebugSend(function(a,b){
console.log(b[0])
})

query.select(conn, "user").first().then(function(v){
    console.log(v);
    conn.end();
})

