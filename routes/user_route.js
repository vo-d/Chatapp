const express = require("express");
const router = express.Router();
const {User, seedUser} = require('../models/user_models.js');
const nunjucks = require('nunjucks')
const mongoUri = "mongodb+srv://dai:09022002@cluster0.esqge8e.mongodb.net/?retryWrites=true&w=majority";

router.use((req, res, next)=>{
    req.model = User;
    next();
})

function restrict(req, res, next){
    if(req.session.user){
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

router.post('/userLogin', (req, res)=>{
    console.log("user ",req.body.user, "and password ", req.body.password )
    req.model.authentication(req.body.user, req.body.password, (user)=>{
        if(user){
            console.log("Authenticated user")
            req.session.regenerate(function(){
                req.session.user = user;
                res.redirect("/user/restricted");
            })
        } else{
            res.redirect("/user/login");
        }

    })
})

router.post('/createUser', async(req, res)=>{
    console.log("New user username",req.body.user, "and password ", req.body.password )
    await seedUser(mongoUri, req.body.user, req.body.password, true)
        .then(result=>console.log(result))
    res.redirect("/user/login");
})

router.route("/restricted")
.get(restrict ,(req, res)=> {
    res.status(200).render("../views/main.njk", {title: "main"})
}) 

module.exports = router;