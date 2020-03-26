const mysql=require('mysql')
const dbconfig=require('./config')
module.exports=mysql.createConnection(dbconfig)