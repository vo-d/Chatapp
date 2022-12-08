const express = require("express");
const router = express.Router();
const {User} = require('../user_models.js');
const nunjucks = require('nunjucks')


router.use((req, res, next)=>{
    req.userCollection = User;
    next();
})

function restrict(req, res, next){
    if(req.session.username){
        next()
    }
    else{
        req.session.error ='Access denied';
        console.log('Access denied')
        res.redirect('/user/login')
    }
}

//Login
router.get('/login', (req, res)=>{
    res.render('../views/login.njk', {})
})

router.post('/login', (req, res)=>{
    User.authentication(req.body.user, req.body.password, (username)=>{
        if(username){
            req.session.username = username
            res.redirect("/user/restricted");
        }
        else{
            res.redirect("/user/login");
        }

    })
})

router.route("/restricted")
.get(restrict ,(req, res)=> {
    res.status(200).render("../views/main.njk", {title: "main"})
}) 

module.exports = router;