const express = require('express');
const session = require('express-session');
let passport = require('passport')
const app = express()
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

// 로그인 했을경우 매 요청시마다 세션에 유저정보를 갱신하는 라우터
let putUserInfo = (req, res, next) => {
    if (req.isAuthenticated()) {
        let getUserInfo = 'SELECT * FROM accounts WHERE name=?'
        db.query(getUserInfo, req.session.passport.user, function (err, data, fields) {
            req.session.userInfo = data[0]
            next()
        })
    } else {
        next()
    }
}

// 백엔드 api 라우터들
let loginRouter = require('./routes/loginapi')
let postRouter = require('./routes/postapi')
app.use('/api', putUserInfo, loginRouter, postRouter)

// 프론트엔드 페이지 라우터`
let indexRouter = require('./routes/index')
app.use('/', indexRouter)

app.listen(3000)