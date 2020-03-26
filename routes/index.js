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
    var readallquery=`SELECT id,nickname,title,content,wtime FROM posts`
    db.query(readallquery,function(err,posts,fields){
        res.render('../views/main',{posts:posts})
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
    var post;
    var readsinglequery=`SELECT id,nickname,title,content,wtime FROM posts WHERE id=${req.params.id}`
    var commentsquery=`SELECT id,nickname,content,wtime FROM comments WHERE postid=${req.params.id}`
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