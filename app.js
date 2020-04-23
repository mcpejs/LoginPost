const express = require('express');
const session = require('express-session');
let passport = require('passport')
const app = express()
const request = require('request')
let db = require('./db/db')

app.use(session({
    secret: 'key~~~!hello~',
    resave: false,
    saveUninitialized: true,
}))

// public 폴더를 /public으로 접근시킴
app.use('/public', express.static('public'))

// post body 사용
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}))

// ejs 사용
app.set('view engine', 'ejs');
app.set('views', 'views');

// passport 사용설정하기
app.use(passport.initialize());
app.use(passport.session());

// 유저정보를 저장하는 라우터
let putUserInfo = (req, res, next) => {
    if (req.isAuthenticated()) {
        let getUserInfo = 'SELECT * FROM accounts WHERE name=?'
        db.query(getUserInfo, req.user, function (err, data, fields) {
            req.session.userInfo = data[0]
            next()
        })
        return
    }
    // 로그인되지않았다면 접근을 거부함
    res.send(`<script type="text/javascript">alert("로그인한후 이용해주세요");location.href = '/login';</script>`)
}

// 관리자일때만 접근시키는 라우터
let ifAdmin = (req, res, next) => {
    if (req.session.userInfo.isAdmin) {
        next()
        return
    }
    res.send(`<script type="text/javascript">alert("당신은 관리자가 아닙니다");location.href = '/';</script>`)
}

// 백엔드 api 라우터들
let loginRouter = require('./routes/loginapi')
let postRouter = require('./routes/postapi')

// 글 api라우터는 로그인했을때만 접근가능 
app.use('/api', loginRouter, putUserInfo, postRouter)

// 프론트엔드 페이지 라우터
let indexRouter = require('./routes/index')
app.use('/', indexRouter)

// 관리자 페이지 라우터
let adminRouter = require('./routes/admin')
app.use('/admin', putUserInfo, ifAdmin, adminRouter)

// TODO: post로 고치기
app.get('/tool/spellCheck/:text', function (req, res) {
    let targetText = req.params.text
    let url = `https://m.search.naver.com/p/csearch/ocontent/util/SpellerProxy?q=${encodeURI(targetText)}&where=nexearch&color_blindness=0&_=1587552692822`
    request.get(url, function (err, result) {
        let resultJson = JSON.parse(result.body)
        res.send(resultJson['message']['result']['notag_html'])
    })
})
app.listen(3000)