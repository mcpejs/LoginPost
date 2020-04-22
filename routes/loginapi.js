const express = require('express')
const path = require('path')
const crypto = require('crypto')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
const router = express.Router()
let db = require('../db/db')

let isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
        return
    }
    res.redirect('/login')
}

// 에러 팝업을 띄우기위한 라우터
router.get('/err', function (req, res) {
    res.send('<script type="text/javascript">alert("다시 시도해주세요");history.back(2);</script>')
})

// 로그인 인증과정
passport.use(new LocalStrategy((username, password, done) => {
    let getpassquery = 'select * from accounts where name=?'
    db.query(getpassquery, username, function (err, data) {

        // 쿼리문에 오류가 있다면
        if (err) {
            return done(false)
        }

        // 데이터가 없다면 - 해당하는 닉네임이 없을떄
        if (!data[0]) {
            return done(false)
        }

        let user = data[0]
        // 입력된 비밀번호 해시값
        let hashedpass = hex_sha256(password)
        // db에 저장된 비밀번호
        let realpass = user.password

        // 비밀번호가 틀리다면
        if (hashedpass != realpass) {
            return done(false)
        }
        return done(null, user)
    })
}))

// 유저 객체에서 식별자인 닉네임 반환
passport.serializeUser(function (user, done) {
    done(null, user.name)
})

passport.deserializeUser(function (name, done) {
    done(null, name)
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/api/err',
}))

//TODO: 회원가입기능 패스포트로 구현해야함
router.post('/register', function (req, res) {
    console.log(req.body)
    if (ishaveEmpty[req.body.nickname, req.body.password]) {
        res.status(401)
        res.send('<script type="text/javascript">alert("누락된 정보가 있습니다.");history.back();</script>')
        return
    }

    let bodynickname = req.body.nickname
    let bodypassword = req.body.password
    let hashedpass = hex_sha256(bodypassword)
    console.log(bodypassword + '\n' + hashedpass)

    let account = {
        name: bodynickname,
        password: hashedpass
    }
    const createaccountquery = 'insert into accounts set ?'
    db.query(createaccountquery, account, function (err, data) {
        if (err) {
            // 쿼리문에 오류가 있다면
            console.log(err)
            res.status(401)
            res.send('<script type="text/javascript">alert("중간과정에 오류가 있었습니다.");history.back();</script>')
        } else {
            res.send('<script type="text/javascript">alert("계정이 성공적으로 생성되었습니다.");location.href="/login"</script>')
        }
    })
})

// get이지만 보여주는 화면이없어 백엔드로 분류
router.get('/logout', isAuthenticated, function (req, res) {
    req.logout()
    res.send('<script type="text/javascript">alert("성공적으로 로그아웃되었습니다");location.href="/"</script>')
})

// 값없는 변수가 포함되있는지 확인하는 함수
function ishaveEmpty(array) {
    let flag = false
    array.forEach(function (element) {
        if (!Boolean(element)) {
            flag = true
            return
        }
    })
    return flag
}

function hex_sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex')
}

module.exports = router