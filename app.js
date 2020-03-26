const express = require('express');
const session = require('express-session');
let passport = require('passport')
const app = express()

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

// 로그인됐을경우 세션의 username항목에 이름을 저장
app.use(function(req,res,next){
    if(req.isAuthenticated()){
        req.session.username=req.session.passport.user
    }
    next()
})

// 백엔드 api 라우터들
let loginRouter = require('./routes/loginapi')
let postRouter = require('./routes/postapi')
app.use('/api', loginRouter,postRouter)

// 프론트엔드 페이지 라우터`
let indexRouter = require('./routes/index')
app.use('/', indexRouter)

app.listen(3000)