/* group members:
Dai Dai Vo - 3129620
Robinpreet Singh - 3127986
Brody Oberdorfer - 3135170 */

const express = require('express');
const fs = require("fs");
const path = require("path")
const nunjuck = require('nunjucks')

const expressWs = require("express-ws")

const app = express();
const port = 5000;
const uri = "mongodb+srv://vo-d3129620:09022002@cluster0.ksuggsl.mongodb.net/?retryWrites=true&w=majority"


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

app.get("/chatroom/:name", (req, res)=>{
    let {name} = req.params;
    console.log(name)
    res.status(200).render("chatbox.njk", {title: `${name}`})
})

app.post("/createRoom", (req, res)=>{

    res.status(200).send(req.body)
})

app.post("/formhandler2", (req, res)=>{

})

app.ws("/chatroom/1", (ws, req)=>{
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