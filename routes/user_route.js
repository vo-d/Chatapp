const express = require("express");
const router = express.Router();
const {MONGODB} = require('../views/credentials')
const mongoUri = `mongodb+srv://${MONGODB.dai.user}:${MONGODB.dai.login}@${MONGODB.dai.cluster}/?retryWrites=true&w=majority`;
const {User, seedUser} = require('../models/user_models.js');

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

router.get('/register', (req, res)=>{
    res.render('../views/register.njk', {})
})


router.post('/logout', (req, res)=>{
    req.session.destroy();
    console.log("logged out")
    res.redirect("/user/login")
})

router.post('/login', (req, res)=>{
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
    console.log(req.body.password)
    console.log("New user username",req.body.user, "and password ", req.body.password )
    req.model.findUser(req.body.user, async (user)=>{
        if(user){
            console.log("username existed")
        }
        else{
            await seedUser(mongoUri, req.body.user, req.body.password, true).then(result=>console.log(result))
        }
    })
    
    res.redirect("/user/login");
})

router.route("/restricted")
.get(restrict ,(req, res)=> {
    res.status(200).render("../views/main.njk", {title: "main"})
}) 

module.exports = router;