var Promise = require("bluebird");

var debug = {
    send : function(conn, args){},
    recv : function(conn, args1, args2){},
}

exports.setDebugSend = function(f){
    debug.send = f;
}
exports.setDebugRecv = function(f){
    debug.recv = f;
}

var native = exports.native = function(){
    var args = [].slice.apply(arguments);
    var conn = args.shift();

    debug.send(conn, args);
    return new Promise( function(resolve, reject){
        args.push(function(err, res){
            debug.recv(conn, args, [].slice.apply(arguments));
            if(err) reject(err);
            else resolve(res);
        });
        conn.query.apply(conn, args);
    });
}

var tx = exports.tx = function(conn, pcallback){
    return native(conn, "BEGIN;").then(function(){
        return pcallback();
    }).then(function(){
        return native(conn, "COMMIT;");
    }).catch(function(err){
        return native(conn, "ROLLBACK;").then(function(){
            throw err;
        })
    })
}

var sql_select = exports.select = function(conn, table, wheres){
    wheres = wheres || {};
    var w = Object.keys(wheres).map(function(key){
        return {key:key, val:wheres[key]}
    })
    var cond = w.map(function(v){ return [v.key,'?'].join('=') }).join("AND");
    var q = [ 'SELECT * FROM ' + table, cond.length ? 'WHERE ' + cond : '' ].join(' ');
    var a = w.map(function(v){ return v.val })

    var p = native(conn, q + ';', a);
    p.first = function(func){
        return p.then(function(res){
            if(res.length <= 0){
                throw new Error("NOT FOUND");
            }
            return res.shift();
        })
    }
    return p;
}

var sql_insert = exports.insert = function(conn, table, column, items){
    var fields = '(' + column.join(',') + ')';
    var values = items.map(function(v){ return '(' + '?' + ')' });
    var q = [ 'INSERT INTO ' + table, fields, 'VALUES', values ].join(' ');
    var p = native(conn, q + ';', items);
    return p;
}

var sql_update = exports.update = function(conn, table, obj, wheres){
    wheres = wheres || {};
    var w = Object.keys(wheres).map(function(key){
        return {key:key, val:wheres[key]}
    })
    var a = w.map(function(v){ return v.val })
    var cond = w.map(function(v){ return [v.key,'?'].join('=') }).join("AND");
    var u = Object.keys(obj).map(function(key){
        return {key:key, val:obj[key]}
    })
    var q = [ 'UPDATE ' + table, 'SET', u.map(function(v){return v.key + '=?'}).join(','), cond.length ? 'WHERE ' + cond : '' ].join(' ');
    var p = native(conn, q + ';', [].concat(u.map(function(v){return v.val}), a));
    return p;
}

var sql_delete = exports.delete = function(conn, table, wheres){
    wheres = wheres || {};
    var w = Object.keys(wheres).map(function(key){
        return {key:key, val:wheres[key]}
    })
    var cond = w.map(function(v){ return [v.key,'?'].join('=') }).join("AND");
    var q = [ 'DELETE FROM ' + table, cond.length ? 'WHERE ' + cond : '' ].join(' ');
    var a = w.map(function(v){ return v.val })

    var p = native(conn, q + ';', a);
    return p;
}

