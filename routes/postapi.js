const express = require('express')
const router = express.Router()
db = require('../db/db')

let ifIgnored = (req, res, next) => {
    // 차단 당했다면
    if (req.session.userInfo.isIgnore) {
        res.status(200)
        res.send(`<script type="text/javascript">alert("당신은 차단당했습니다");location.href = '/';</script>`)
        return
    }
    // 차단 당하지 않았다면
    next()

}

router.post('/create_post', ifIgnored, function (req, res) {

    let nickname = req.session.userInfo.name
    let title = req.body.title
    let content = req.body.content
    let isAdminAuthor = req.session.userInfo.isAdmin
    if (ishaveEmpty(nickname, title, console)) {
        // 정보가 잘못 제출되었을때
        res.status(401)
        res.send('<script type="text/javascript">alert("모든값은 입력되어야합니다");history.back();</script>')
        return
    }

    // NOW() 함수 사용을 위해서 set를 사용하지않음
    const createquery = `INSERT INTO posts(author,title,content,wtime,isNotice,isAdminAuthor) VALUES(?,?,?,NOW(),0,?)`
    db.query(createquery, [nickname, title, content, isAdminAuthor], function (err, result, fields) {
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

router.post('/update_post', function (req, res) {
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

    const getPostAuthorquery = `SELECT author FROM posts WHERE id=?`
    const updatePostquery = `UPDATE posts set title=?,content=? where id=?;`

    db.query(getPostAuthorquery, postid, function (err, data, fields) {
        let postAuthor = data[0].author
        if (postAuthor == nickname) {
            db.query(updatePostquery, [title, content, postid], function (err, data, fields) {
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

    const getPostAuthorquery = 'SELECT author FROM posts WHERE id=?'

    const deletePostquery = 'DELETE FROM posts WHERE id=?'
    const deleteCommentsquery = 'DELETE FROM comments WHERE post_id=?'
    const deleteLikequery = 'DELETE FROM accountLikes WHERE post_id=?'
    db.query(getPostAuthorquery, postid, function (err, authorData, fields) {
        let postAuthor = authorData[0].author

        // 요청자가 글 작성자라면
        if (nickname == postAuthor) {
            db.query(deleteCommentsquery, postid, () => db.query(deleteLikequery, postid, () => db.query(deletePostquery, postid)))
            res.status(200)
            res.send(`<script type="text/javascript">alert("성공적으로 삭제되었습니다.");location.href = '/';</script>`)
        }

        // 요청자가 관리자라면
        else if (isAdmin) {
            db.query(deleteCommentsquery, postid, () => db.query(deleteLikequery, postid, () => db.query(deletePostquery, postid)))
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

router.post('/create_comment', ifIgnored, function (req, res) {
    let nickname = req.session.userInfo.name
    let content = req.body.content
    let postid = req.body.postid
    if (ishaveEmpty(nickname, postid, content)) {
        // 정보가 잘못 제출되었을때
        res.status(401)
        res.send('<script type="text/javascript">alert("모든값은 입력되어야합니다.");history.back();</script>')
        return
    }

    const createcommentquery = `INSERT INTO comments(author,content,post_id,wtime) VALUES("${nickname}","${content}","${postid}",NOW())`
    const checkpostexistsquery = `select id from posts where id = ${postid};`
    db.query(checkpostexistsquery, function (err, data, fields) {
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

    const getCommentAuthorquery = `SELECT author,post_id FROM comments WHERE id=?`
    const deletecommentquery = `DELETE FROM comments WHERE id=?`
    db.query(getCommentAuthorquery, commentid, function (err, data, fields) {
        let commentAuthor = data[0].author
        let postid = data[0].post_id

        // 요청자가 댓글 작성자라면
        if (commentAuthor == nickname) {
            db.query(deletecommentquery, commentid, function (err, data, fields) {
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

// 게시글 좋아요
router.get('/like_post/:id', function (req, res) {
    let post_id = req.params.id
    let nickname = req.session.userInfo.name

    const checkDupeLike = 'SELECT * FROM accountlikes where name=? and post_id=?'
    const likePost = 'INSERT INTO accountlikes SET name=?,post_id=?'
    // 추천정보 존재여부 확인
    db.query(checkDupeLike, [nickname, post_id], function (err, data) {
        if (data[0]) {
            // 이미 추천 정보가 있을때
            res.status(400)
            res.send(`<script type="text/javascript">alert("이미 추천한 게시글입니다.");history.back();</script>`)
            return
        }
        // 추천정보가 없을때

        // 추천 정보 넣기
        db.query(likePost, [nickname, post_id], function (err, data) {
            if (err) {
                console.log(err)
                // 만약 에러가 있다면
                res.status(401)
                res.send(`<script type="text/javascript">alert("예상치 못한 오류");history.back();</script>`)
                return
            }
            res.send(`<script type="text/javascript">alert("성공적으로 추천되었습니다");location.href = '/view_post/${post_id}';</script>`)
        })
    })
})

// 게시글 좋아요 취소
router.get('/unLike_post/:id', function (req, res) {
    let post_id = req.params.id
    let nickname = req.session.userInfo.name

    const checkDupeLike = 'SELECT * FROM accountlikes where name=? and post_id=?'
    const likePost = 'DELETE FROM accountlikes WHERE name=? and post_id=?'
    // 추천정보 존재여부 확인
    db.query(checkDupeLike, [nickname, post_id], function (err, data) {
        if (!data[0]) {
            // 추천정보가 없을때
            res.status(400)
            res.send(`<script type="text/javascript">alert("추천하지 않은 게시글입니다.");history.back();</script>`)
            return
        }

        // 추천정보가 있을때

        // 추천 정보 삭제
        db.query(likePost, [nickname, post_id], function (err, data) {
            if (err) {
                console.log(err)
                // 만약 에러가 있다면
                res.status(401)
                res.send(`<script type="text/javascript">alert("예상치 못한 오류");history.back();</script>`)
                return
            }
            res.send(`<script type="text/javascript">alert("성공적으로 취소되었습니다");location.href = '/view_post/${post_id}';</script>`)
        })
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
