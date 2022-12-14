const express = require("express");
const mongodb = require('mongodb');
const router = express.Router();
const {check_chatroomName, check_add_chatroomName, delete_Chatroom, serverSideSchemaChatroom} = require('../models/chatroom_models');
const {MONGODB} = require('../views/credentials')
const mongoUri = `mongodb+srv://${MONGODB.dai.user}:${MONGODB.dai.login}@${MONGODB.dai.cluster}/?retryWrites=true&w=majority`;const client = new mongodb.MongoClient(mongoUri);

router.use((req, res, next)=>{
    next();
})

// this will go to chatbox.njk. Which will create websocket chatroom if not exist, or join that chatroom if exist

router.get("/chatroom/:name", async (req, res)=>{
    let {name} = req.params;
    console.log("Name of Room",name)
    await client.connect();
    const myCol = await client.db('express').collection("chatroomName");
    let doc = await myCol.findOne({chatroom:name})
    if(doc === null){
        // we will send custom 404 here
        res.status(404).sendFile(__dirname + "/views/404.html")
    }else{
        res.status(200).render("chatbox.njk", {title: `${name}`})
    }

})

// handle the post request of createRoom, and send data back to the server side
router.post("/createRoom", async (req, res)=>{
    let roomName = req.body.roomName;
    await check_add_chatroomName(roomName, req, res);
})

router.post("/joinRoom", async (req, res)=>{
    let roomName = req.body.roomName;
    await check_chatroomName(roomName, req, res);
})

router.post("/deleteChatroom", async (req, res)=>{
    let roomName = req.body.deleteChatroom;
    await delete_Chatroom(roomName);
})

module.exports = router