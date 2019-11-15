const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
    host: 'remotemysql.com',
    user: '8RBrqYscg5',
    password: 'ANSvZtj4L2',
    database: '8RBrqYscg5'
});

mysqlConnection.connect(function (err){
    if(err){
        console.log(err);
        return;
    } else{
        console.log('DB connected');
    }
});

module.exports = mysqlConnection;