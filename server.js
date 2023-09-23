/* group members:
Dai Dai Vo - 3129620
Robinpreet Singh - 3127986
Brody Oberdorfer - 3135170 */
const express = require('express');
const nunjuck = require('nunjucks')
const expressWs = require("express-ws")
const serveIndex = require('serve-index')
const session = require('express-session')
const {delete_Chatroom} = require("./models/chatroom_models")
const {Session} = require('./views/credentials')

const app = express();
const port = 5000;

app.use("/files", serveIndex(__dirname+"/views", {icons: true}))
app.use('/', express.static(__dirname+"/views"))
app.use(express.urlencoded({extended:true}))

let env = nunjuck.configure("views", {
    autoescape: false,
    express: app,
    noCache: true
})

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    secret: Session.secret
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
        const data = JSON.parse(msg);
        console.log(data)
        const returnData = {name:req.session.user, message:data.message}
        aWss.clients.forEach((client)=>{
            client.send(JSON.stringify(returnData))
        })
    })
    // closing the websocket and deleting the room from database
    ws.addEventListener('close', async (event) => {

        // erase the chatroomName only when all client are down
        if(aWss.clients.size === 0){
            await delete_Chatroom(room);
        }
    })
})

//400 error
app.use((req,res) =>{
    res.status(404).sendFile(__dirname + "/views/404.html")
    
})

//500 error
app.use((err,req,res, next) =>{
    res.status(500).sendFile(__dirname +"/views/500.html")
})

app.listen(port)
