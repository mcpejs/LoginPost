const express = require('express')
const path = require('path')
const router = express.Router()
let db = require('../db/db')

// 로그인되지 않았다면 로그인페이지로 연결하는 라우터
let ifAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
        return
    }
    res.redirect('/login')
}

router.get('/', function (req, res) {
    // 페이지수 없이 접근한다면 1페이지로 보냅니다.
    res.redirect('/list_post/1')
})

router.get('/list_post/:page', function (req, res) {
    let postperpage = 10

    // 요청자의 첫페이지는 1 페이지입니다.
    let requestPage = req.params.page

    // 게시판 페이지 번호는 숫자만 들어와야합니다.
    if (isNaN(requestPage)) {
        res.status(404)
        res.send('<script type="text/javascript">alert("정상적인 접근이 아닙니다.");location.href="/"</script>')
    }
    requestPage = Number(requestPage)
    db.query('select count(*) as postcount from posts;', function (err, data, fields) {

        // 마지막 페이지를 알기위한 게시물수
        let postcount = data[0].postcount

        // 게시물을 보기위한 마지막 페이지를 구합니다
        // 요청자 입장에서의 마지막페이지를 구하기위해 1을 더합니다.
        let lastPage = Math.floor(postcount / postperpage) + 1

        let startIndex
        if (lastPage < requestPage) {
            // 만약 요청페이지가 마지막 페이지를 넘었다면
            // 이전 페이지로 돌려보냅니다.
            res.status(404)
            res.send('<script type="text/javascript">alert("해당 페이지는 없습니다.");history.back(1)</script>')
            return
        } else if (requestPage < 1) {
            // 만약 요청페이지가 1페이지보다 작다면
            // 이전 페이지로 돌려보냅니다.
            res.status(404)
            res.send('<script type="text/javascript">alert("해당 페이지는 없습니다.");history.back(1)</script>')
            return
        } else if (requestPage == lastPage) {
            // 만약 요청페이지가 마지막 페이지라면
            // 뒤에서부터 10개의 글만 보여줍니다.
            startIndex = postcount - postperpage
        } else {
            // 위 조건에 모두 해당하지 않는 페이지라면
            // 모든 페이지에 같은 방법을 적용해 글을 구합니다.
            startIndex = postperpage * (requestPage - 1)
        }

        let readpostquery = `SELECT * FROM posts ORDER BY id desc LIMIT ${startIndex},${postperpage}`
        db.query(readpostquery, function (err, posts, fields) {
            res.render('../views/main', {
                posts: posts,
                currentPage: Number(requestPage),
                lastPage: lastPage,
                isAuthenticated:req.isAuthenticated()
            })
        })
    })
})

router.get('/profile', ifAuthenticated, function (req, res) {
    let getUserInfo = 'SELECT * FROM accounts WHERE name=?'
    db.query(getUserInfo, req.session.passport.user, function (err, data, fields) {
        let userInfo = data[0]
        res.render('../views/myprofile', {
            userInfo: userInfo
        })
    })
})

router.get('/create_post', ifAuthenticated, function (req, res) {
    res.sendFile(path.resolve('./views/create.html'))
})

router.get('/view_post/:id', function (req, res) {
    // 글 내용을 읽기위한 쿼리
    let readsinglequery = `SELECT * FROM posts WHERE id=${req.params.id}`

    // 댓글 내용을 읽기위한 쿼리
    let commentsquery = `SELECT * FROM comments WHERE postid=${req.params.id}`
    db.query(readsinglequery, function (err, postdata, fields) {
        let post = postdata[0]
        db.query(commentsquery, function (err, commentsdata, fields) {
            res.render('../views/view', {
                post: post,
                comments: commentsdata
            })
        })

    })
})

router.get('/update_post/:id', ifAuthenticated, function (req, res) {
    res.render('../views/update', {
        id: req.params.id
    })
})

router.get('/delete_post/:id', ifAuthenticated, function (req, res) {
    res.render('../views/delete', {
        id: req.params.id
    })
})

router.get('/delete_comment/:commentid', ifAuthenticated, function (req, res) {
    res.render('../views/deletecomment', {
        commentid: req.params.commentid
    })
})

router.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/')
        return
    }
    res.sendFile(path.resolve('./views/loginpage.html'))
})

router.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/')
        return
    }
    res.sendFile(path.resolve('./views/register.html'))
})

module.exports = router