/* group members:
Dai Dai Vo - 3129620
Robinpreet Singh - 3127986
Brody Oberdorfer - 3135170 */
const multiparty = require('multiparty')
const express = require('express');
const fs = require("fs");
const path = require("path")
const nunjuck = require('nunjucks')
const mongodb = require('mongodb')
const expressWs = require("express-ws")
const serveIndex = require('serve-index')
const session = require('express-session')
const {seedUser} = require('./models/user_models.js')
const {func} = require("./models/chatroom_models")
const app = express();
const port = 5000;

app.use("/files", serveIndex(__dirname+"/views", {icons: true}))
app.use('/files', express.static(__dirname+"/views"))
app.use(express.urlencoded({extended:true}))

let env = nunjuck.configure("views", {
    autoescape: false,
    express: app,
    noCache: true
})

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    secret: "My super secret"
}))

//Set up router
const user_routes = require('./routes/user_route.js');
app.use("/user", user_routes)

const chat_routes = require('./routes/chatroom_routes')
app.use("/", chat_routes)

const public_routes = require('./routes/public_routes')
app.use("/", public_routes)

// Declare wsInstance
const wsInstance = expressWs(app)

app.ws(`/chatroom/:room`, async (ws, req)=>{
    let {room} = req.params;
    //get websocket server
    const aWss = wsInstance.getWss(`/chatroom/${room}`);

    // when websocket server receive data
    ws.on("message", (msg)=>{
        // send data back to every client
        aWss.clients.forEach((client)=>{
            client.send(msg)
        })
    })
    // closing the websocket and deleting the room from database
    ws.addEventListener('close', async (event) => {

        // erase the chatroomName only when all client are down
        if(aWss.clients.size === 0){
            func.delete_Chatroom(room);
        }
    })
})

app.use((req,res) =>{
    res.status(404).sendFile(__dirname + "/views/404.html")
    
})

app.listen(port)