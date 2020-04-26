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

// 일반글 조회
router.get('/list_post/:page', function (req, res) {
    let postperpage = 10

    // 요청자의 첫페이지는 1 페이지입니다.
    let requestPage = req.params.page

    if (requestPage < 1) {
        // 만약 요청페이지가 1페이지보다 작다면
        // 이전 페이지로 돌려보냅니다.
        res.status(404)
        res.send('<script type="text/javascript">alert("해당 페이지는 없습니다.");history.back(1)</script>')
        return
    }

    // 게시판 페이지 번호는 숫자만 들어와야합니다.
    if (isNaN(requestPage)) {
        res.status(404)
        res.send('<script type="text/javascript">alert("정상적인 접근이 아닙니다.");location.href="/"</script>')
    }
    requestPage = Number(requestPage)
    db.query('select count(*) as postcount FROM posts WHERE isNotice=0;', function (err, data, fields) {
        
        // 마지막 페이지를 알기위한 게시물수
        let postcount = data[0].postcount

        // 게시물을 보기위한 마지막 페이지를 구합니다
        let lastPage = Math.floor(postcount / postperpage) + 1

        if (lastPage < requestPage) {
            // 만약 요청페이지가 마지막 페이지를 넘었다면
            // 이전 페이지로 돌려보냅니다.
            res.status(404)
            res.send('<script type="text/javascript">alert("해당 페이지는 없습니다.");history.back(1)</script>')
            return
        }
        let startIndex=getStartIndex(postcount,postperpage,requestPage,lastPage)
        
        const readpost = `SELECT posts.*,ifnull(likes.likecount,0) AS likeCount FROM posts LEFT JOIN (SELECT post_id,count(*) AS likecount FROM accountlikes GROUP BY post_id) AS likes ON posts.id=likes.post_id WHERE isNotice = 0 ORDER BY id DESC LIMIT ${startIndex},${postperpage}`
        const readNotice = 'SELECT * FROM posts WHERE isNotice=1 ORDER BY id desc'
        db.query(readpost, function (err, posts, fields) {
            db.query(readNotice, function (err, notices) {
                res.render('../views/normalList', {
                    posts: posts,
                    notices: notices,
                    currentPage: Number(requestPage),
                    lastPage: lastPage,
                    isAuthenticated: req.isAuthenticated()
                })
            })
        })
    })
})

// 추천글 조회
//TODO: 일반글 조회와 중복되는코드 수정하기
router.get('/list_recommendPost/:page', function (req, res) {
    let postperpage = 10

    // 요청자의 첫페이지는 1 페이지입니다.
    let requestPage = req.params.page

    if (requestPage < 1) {
        // 만약 요청페이지가 1페이지보다 작다면
        // 이전 페이지로 돌려보냅니다.
        res.status(404)
        res.send('<script type="text/javascript">alert("해당 페이지는 없습니다.");history.back(1)</script>')
        return
    }

    // 게시판 페이지 번호는 숫자만 들어와야합니다.
    if (isNaN(requestPage)) {
        res.status(404)
        res.send('<script type="text/javascript">alert("정상적인 접근이 아닙니다.");location.href="/"</script>')
    }
    requestPage = Number(requestPage)
    //TODO: 중복안된부분 1
    db.query('SELECT count(if(likes.likecount>=2,1,null)) AS postcount FROM posts LEFT JOIN (SELECT post_id,count(*) AS likecount FROM accountlikes GROUP BY post_id) AS likes ON posts.id=likes.post_id WHERE isNotice = 0', function (err, data, fields) {
        // select count(*) as postcount FROM posts WHERE isNotice=0;
        // 마지막 페이지를 알기위한 게시물수
        let postcount = data[0].postcount

        // 게시물을 보기위한 마지막 페이지를 구합니다
        let lastPage = Math.floor(postcount / postperpage) + 1

        if (lastPage < requestPage) {
            // 만약 요청페이지가 마지막 페이지를 넘었다면
            // 이전 페이지로 돌려보냅니다.
            res.status(404)
            res.send('<script type="text/javascript">alert("해당 페이지는 없습니다.");history.back(1)</script>')
            return
        }
        let startIndex=getStartIndex(postcount,postperpage,requestPage,lastPage)
        
        //TODO: 중복안된부분 2
        // SELECT posts.*,ifnull(likes.likecount,0) AS likeCount FROM posts LEFT JOIN (SELECT post_id,count(*) AS likecount FROM accountlikes GROUP BY post_id) AS likes ON posts.id=likes.post_id WHERE isNotice = 0 ORDER BY id DESC LIMIT ${startIndex},${postperpage}
        const readpost = `SELECT posts.*,ifnull(likes.likecount,0) AS likeCount FROM posts LEFT JOIN (SELECT post_id,count(*) AS likecount FROM accountlikes GROUP BY post_id) AS likes ON posts.id=likes.post_id WHERE isNotice = 0 and likeCount>=2 ORDER BY id DESC LIMIT ${startIndex},${postperpage}`
        const readNotice = 'SELECT * FROM posts WHERE isNotice=1 ORDER BY id desc'
        db.query(readpost, function (err, posts, fields) {
            db.query(readNotice, function (err, notices) {
                //TODO: 중복안된부분 3
                // ../views/normalList
                res.render('../views/recommendList', {
                    posts: posts,
                    notices: notices,
                    currentPage: Number(requestPage),
                    lastPage: lastPage,
                    isAuthenticated: req.isAuthenticated()
                })
            })
        })
    })
})

router.get('/profile', ifAuthenticated, function (req, res) {
    let getUserInfo = 'SELECT * FROM accounts WHERE name=?'
    db.query(getUserInfo, req.user, function (err, data, fields) {
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
    let post_id = req.params.id
    const readsinglequery = `SELECT *,(SELECT count(name) FROM accountlikes where post_id=?) as likeCount FROM posts WHERE id=?`
    const commentsquery = `SELECT * FROM comments WHERE post_id=?`
    const getUserInfo = 'SELECT *,(SELECT COUNT(*) FROM accountlikes where name=? and post_id=?) as isLiked FROM accounts WHERE name=?'
    // 글 내용읽기
    db.query(readsinglequery, [post_id, post_id], function (err, post, fields) {
        // 댓글 내용읽기
        db.query(commentsquery, post_id, function (err, comments, fields) {
            if (req.isAuthenticated()) {
                // 로그인됐다면 유저정보 가져오기
                db.query(getUserInfo, [req.user, post_id, req.user], function (err, userData) {
                    res.render('../views/view', {
                        post: post[0],
                        comments: comments,
                        userInfo: userData[0]
                    })
                })
                return
            }
            res.render('../views/view', {
                post: post[0],
                comments: comments,
                userInfo: false
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

function getStartIndex(postcount,postperpage,requestPage,lastPage){
    if (lastPage == 1) {
        return 0
    } else if (requestPage == lastPage) {
        // 만약 요청페이지가 마지막 페이지라면
        // 뒤에서부터 10개의 글만 보여줍니다.
        return postcount - postperpage
    } else {
        // 위 조건에 모두 해당하지 않는 페이지라면
        // 모든 페이지에 같은 방법을 적용해 글을 구합니다.
        return postperpage * (requestPage - 1)
    }
}
module.exports = router