const express = require('express')
const router = express.Router()
let db = require('../db/db')

router.get('/', function (req, res) {
    res.render('../views/admin/main')
})

router.get('/ignoreList', function (req, res) {
    let getIgnoreUsers = 'SELECT name FROM accounts WHERE isIgnore=1'
    db.query(getIgnoreUsers, function (err, data) {
        res.render('../views/admin/ignoreList', {
            users: data
        })
    })
})

router.get('/ignoreTool', function (req, res) {
    res.render('../views/admin/ignoreTool')
})

// 유저 차단기능
router.get('/api/Ignore/:name', function (req, res) {
    let targetName = req.params.name
    let ignoreUser = 'UPDATE accounts SET isIgnore=1 WHERE name=?'
    db.query(ignoreUser, targetName, function (err, data) {
        if (err) {
            console.log(err)
            res.send(`<script type="text/javascript">alert("존재하지 않는 유저입니다.");history.back();</script>`)
            return
        }
        res.send(`<script type="text/javascript">alert("성공적으로 차단되었습니다.");location.href = '/admin/ignoreList';</script>`)
    })
})

// 유저 차단해제기능
router.get('/api/unIgnore/:name', function (req, res) {
    let targetName = req.params.name
    let unIgnoreUser = 'UPDATE accounts SET isIgnore=0 WHERE name=?'
    db.query(unIgnoreUser, targetName, function (err, data) {
        if (err) {
            console.log(err)
            res.send(`<script type="text/javascript">alert("존재하지 않는 유저입니다.");history.back();</script>`)
            return
        }
        res.send(`<script type="text/javascript">alert("성공적으로 차단 해제되었습니다.");location.href = '/admin/ignoreList';</script>`)
    })
})

module.exports = router