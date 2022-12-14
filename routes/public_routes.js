const path = require("path")
const express = require("express");
const router = express.Router();

router.use((req, res, next)=>{
    next();
})

router.get("/credit", (req, res)=>{
    let contributorList = require(path.resolve(__dirname + "/../views/contributor.json"))
    console.log(contributorList)
    res.status(200).render("contributor.njk", {contributors: contributorList, title: "credit"})
})

router.get("/terms&conditions", (req, res)=>{
    let directory = path.resolve(__dirname + "/../views/term&condition.txt")
    res.download(decodeURI(directory), (err)=>{
        console.log(err)
    })
})

module.exports = router
