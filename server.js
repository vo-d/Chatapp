/* group members:
Dai Dai Vo - 3129620
Robinpreet Singh - 3127986
Brody Oberdorfer - 3135170 */

const express = require('express');
const fs = require("fs");
const path = require("path")
const nunjuck = require('nunjucks')
const mongodb = require('mongodb')
const expressWs = require("express-ws")

const app = express();
const port = 5000;

//put our mongodb uri here
const mongoUri = "mongodb+srv://rob:tukikrna@cluster0.esqge8e.mongodb.net/?retryWrites=true&w=majority";
const client = new mongodb.MongoClient(mongoUri);

async function myfunction(username){
    await client.connect();
    const myCol = await client.db('express').collection("users");
    const doc = await myCol.findOne({user:username})
    if(doc === null){
        let newUser = {user:username}
        let result = await myCol.insertOne(newUser)
        console.log(result)
    }
    console.log(doc)
}

const wsInstance = expressWs(app)

let env = nunjuck.configure("views", {
    autoescape: false,
    express: app,
    noCache: true
})

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.get("/", (req, res)=>{
    res.status(200).render("main.njk", {title: "main"})
})

// this will go to chatbox.njk. Which will create websocket chatroom if not exist, or join that chatroom if exist
app.get("/chatroom/:name", (req, res)=>{
    let {name} = req.params;
    console.log(name)
    res.status(200).render("chatbox.njk", {title: `${name}`})
})

// handle the post request of createRoom, and send data back to the server side
app.post("/createRoom", async (req, res)=>{
    
    req.body.message = "true";
    let user = req.body.user;
    await myfunction(user)
    res.status(200).send(req.body)
})

app.post("/formhandler2", (req, res)=>{

})

app.ws("/chatroom/1", async (ws, req)=>{
    //get websocket server
    const aWss = wsInstance.getWss("/chatroom/1");
    // when websocket server receive data
    ws.on("message", (msg)=>{
        // send data back to every client
        aWss.clients.forEach((client)=>{
            client.send(msg)
        })
    })
})

app.listen(port)