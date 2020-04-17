const express = require('express')
const path = require('path')
const router = express.Router()
let db = require('../db/db')

router.get('/ignoreList',function(req,res){
    let getIgnoreUsers='SELECT name FROM accounts WHERE isIgnore=1'
    db.query(getIgnoreUsers,function(err,data){
        res.render('../views/ignoreList',{
            users:data
        })
    })
})

module.exports=router