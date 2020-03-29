const express = require('express')
const path = require('path')
const router = express.Router()

// 로그인되지 않았다면 로그인페이지로 연결하는 라우터
let ifAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
        return
    }
    res.redirect('/login')
}

router.get('/',function(req,res){
    // 페이지수 없이 접근한다면 1페이지로 보냅니다.
    res.redirect('/list_post/1')
})

router.get('/list_post/:page',function(req,res){
    let postperpage=10
    let requestPage=req.params.page
    db.query('select count(*) as postcount from posts;',function(err,data,fields){
        // 마지막 페이지를 알기위한 게시물수
        let postcount=data[0].postcount

        // 게시물을 보기위한 마지막 페이지
        let lastPage=Math.floor(postcount/postperpage)+1

        let startPost
        // 마지막 페이지 이상의 요청들은 모두 마지막 페이지를 조회한것으로 간주
        if(lastPage<=requestPage){
            startPost=postcount-postperpage
        } else {
            startPost=postperpage*requestPage-postperpage
        }
        
        let readpostquery=`SELECT * FROM posts ORDER BY id desc LIMIT ${startPost},${postperpage}`
        db.query(readpostquery,function(err,posts,fields){
            res.render('../views/main',{posts:posts})
        })
    })
})

router.get('/profile', ifAuthenticated, function (req, res) {
    res.render('../views/myprofile', {
        nickname: req.session.passport.user
    })
})

router.get('/create_post',ifAuthenticated,function(req,res){
    res.sendFile(path.resolve('./views/create.html'))
})

router.get('/view_post/:id',function(req,res){
    let post;
    let readsinglequery=`SELECT * FROM posts WHERE id=${req.params.id}`
    let commentsquery=`SELECT * FROM comments WHERE postid=${req.params.id}`
    db.query(readsinglequery,function(err,postdata,fields){
        post=postdata[0]
        db.query(commentsquery,function(err,commentsdata,fields){
            res.render('../views/view',{post:post,comments:commentsdata})
        })
        
    })
})

router.get('/update_post/:id',ifAuthenticated,function(req,res){
    res.render('../views/update',{id:req.params.id})
})

router.get('/delete_post/:id',ifAuthenticated,function(req,res){
    res.render('../views/delete',{id:req.params.id})
})

router.get('/delete_comment/:commentid',ifAuthenticated,function(req,res){
    res.render('../views/deletecomment',{commentid:req.params.commentid})
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