const express = require('express')
const router = express.Router()
db = require('../db/db')

let ifAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
        return
    }
    res.redirect('/login')
}

router.post('/create_post', ifAuthenticated, function (req, res) {
    let nickname = req.session.userInfo.name
    let title = req.body.title
    let content = req.body.content

    if (ishaveEmpty(nickname, title, console)) {
        // 정보가 잘못 제출되었을때
        res.status(401)
        res.send('<script type="text/javascript">alert("모든값은 입력되어야합니다");history.back();</script>')
        return
    }

    // NOW() 함수 사용을 위해서 set를 사용하지않음
    let createquery = `INSERT INTO posts(nickname,title,content,wtime) VALUES("${nickname}","${title}","${content}",NOW())`
    db.query(createquery, function (err, result, fields) {
        if (err) {
            console.log(err)
            // 만약 에러가 있다면
            res.status(401)
            res.send(`<script type="text/javascript">alert("내용이 잘못되었습니다");history.back();</script>`)
        } else {
            // 만약 에러가 없다면
            res.status(200)
            res.send(`<script type="text/javascript">alert("성공적으로 작성되었습니다.");location.href = '/';</script>`)
        }
    })
})

router.post('/update_post', ifAuthenticated, function (req, res) {
    let postid = req.body.id
    let nickname = req.session.userInfo.name
    let title = req.body.title
    let content = req.body.content

    if (ishaveEmpty(postid, nickname, title, content)) {
        // 정보가 잘못 제출되었을때
        res.status(401)
        res.send('<script type="text/javascript">alert("모든값은 입력되어야힙니다.");history.back();</script>')
        return
    }

    let getPostAuthorquery = `SELECT nickname FROM posts WHERE id=?`
    let updatePostquery = `UPDATE posts set title=?,content=? where id=?;`

    db.query(getPostAuthorquery,postid, function (err, data, fields) {
        let postAuthor = data[0].nickname
        if (postAuthor == nickname) {
            db.query(updatePostquery,[title,content.postid], function (err, data, fields) {
                if (err) {
                    // 만약 에러가 있다면
                    res.status(401)
                    res.send(`<script type="text/javascript">alert("내용이 잘못되었습니다");history.back();</script>`)
                } else {
                    // 만약 에러가 없다면
                    res.status(200)
                    res.send(`<script type="text/javascript">alert("성공적으로 수정되었습니다.");location.href = '/view_post/${postid}';</script>`)
                }
            })
        } else {
            res.status(401)
            res.send(`<script type="text/javascript">alert("자신의 글만 수정할수있습니다.");location.href = '/';</script>`)
        }
    })
})

router.post('/delete_post', function (req, res) {
    let postid = req.body.id
    let nickname = req.session.userInfo.name
    let isAdmin = req.session.userInfo.isAdmin

    let getPostAuthorquery = 'SELECT nickname FROM posts WHERE id=?'
    let deletePostquery = 'DELETE FROM posts WHERE id=?'
    let deleteCommentsquery = 'DELETE FROM comments WHERE postid=?'
    db.query(getPostAuthorquery, postid, function (err, authorData, fields) {
        let postAuthor = authorData[0].nickname

        // 요청자가 글 작성자라면
        if (nickname == postAuthor) {
            // 댓글 삭제후 글삭제
            db.query(deleteCommentsquery, postid, () => db.query(deletePostquery, postid))
            res.status(200)
            res.send(`<script type="text/javascript">alert("성공적으로 삭제되었습니다.");location.href = '/';</script>`)
        }

        // 요청자가 관리자라면
        else if (isAdmin) {
            // 댓글 삭제후 글삭제
            db.query(deleteCommentsquery, postid, () => db.query(deletePostquery, postid))
            res.status(200)
            res.send(`<script type="text/javascript">alert("관리자 권한으로 삭제되었습니다.");location.href = '/';</script>`)
        }

        // 관리자가 아닌 일반 유저라면
        else {
            res.status(401)
            res.send(`<script type="text/javascript">alert("자신의 글만 삭제할수있습니다.");location.href = '/';</script>`)
        }
    })
})

router.post('/create_comment', ifAuthenticated, function (req, res) {
    let nickname = req.session.userInfo.name
    let content = req.body.content
    let postid = req.body.postid
    if (ishaveEmpty(nickname, postid, content)) {
        // 정보가 잘못 제출되었을때
        res.status(401)
        res.send('<script type="text/javascript">alert("모든값은 입력되어야합니다.");history.back();</script>')
        return
    }

    let createcommentquery = `INSERT INTO comments(nickname,content,postid,wtime) VALUES("${nickname}","${content}","${postid}",NOW())`
    let checkpostidquery = `select id from posts where id = ${postid};`
    db.query(checkpostidquery, function (err, data, fields) {
        if (err || !data.length) {
            // 만약 게시글이 없다면
            res.status(401)
            res.send(`<script type="text/javascript">alert("없는 게시글 번호입니다.");history.back();</script>`)
        } else {
            // 만약 게시글이 있다면 댓글작성
            db.query(createcommentquery, function (err, result, fields) {
                if (err) {
                    console.log(err)
                    // 만약 작성중 에러가 있다면
                    res.status(401)
                    res.send(`<script type="text/javascript">alert("내용이 잘못되었습니다");history.back();</script>`)
                } else {
                    // 만약 에러가 없다면
                    res.status(200)
                    res.send(`<script type="text/javascript">alert("성공적으로 작성되었습니다.");location.href = '/view_post/${postid}';</script>`)
                }
            })
        }
    })
})

router.post('/delete_comment', function (req, res) {
    let commentid = req.body.id
    let nickname = req.session.userInfo.name
    let isAdmin = req.session.userInfo.isAdmin

    let getCommentAuthorquery = `SELECT postid,nickname FROM comments WHERE id=${commentid}`
    let deletecommentquery = `DELETE FROM comments WHERE id=${commentid}`
    db.query(getCommentAuthorquery, function (err, data, fields) {
        let commentAuthor = data[0].nickname
        let postid = data[0].postid

        // 요청자가 댓글 작성자라면
        if (commentAuthor == nickname) {
            db.query(deletecommentquery, function (err, data, fields) {
                res.status(200)
                res.send(`<script type="text/javascript">alert("성공적으로 삭제되었습니다.");location.href='/view_post/${postid}';</script>`)
            })
        } 

        // 요청자가 관리자라면
        else if (isAdmin) {
            db.query(deletecommentquery, function (err, data, fields) {
                res.status(200)
                res.send(`<script type="text/javascript">alert("관리자 권한으로 삭제되었습니다.");location.href='/view_post/${postid}';</script>`)
            })
        } 

        // 관리자가 아닌 타인이라면
        else {
            res.status(401)
            res.send(`<script type="text/javascript">alert("자신의 댓글만 삭제할수있습니다.");location.href = '/';</script>`)
        }
    })
})

// 값없는 변수가 포함되있는지 확인하는 함수
function ishaveEmpty(...array) {
    let flag = false
    array.forEach(function (element) {
        if (!Boolean(element)) {
            flag = true
            return
        }
    })
    return flag
}

module.exports = router