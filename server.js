/* group members:
Dai Dai Vo - 3129620
Robinpreet Singh - 3127986
Brody Oberdorfer - 3135170 */
const multiparty = require('multiparty')
const express = require('express');

const path = require("path")
const nunjuck = require('nunjucks')
const mongodb = require('mongodb')
const expressWs = require("express-ws")
const serveIndex = require('serve-index')
const session = require('express-session')

const app = express();
const port = 5000;

app.use("/files", serveIndex(__dirname+"/views", {icons: true}))
app.use('/', express.static(__dirname+"/views"))
app.use(express.urlencoded({extended:true}))

//put our mongodb uri here
const mongoUri1 = "mongodb://localhost:27017";
const mongoUri = "mongodb+srv://dai:09022002@cluster0.esqge8e.mongodb.net/?retryWrites=true&w=majority";
const client = new mongodb.MongoClient(mongoUri);

async function check_add_chatroomName(chatroomName, req, res){
    await client.connect();
    const myCol = await client.db('express').collection("chatroomName");
    let doc = await myCol.findOne({chatroom:chatroomName})
    if(doc === null){
        let newChatroom = {chatroom:chatroomName}
        let result = await myCol.insertOne(newChatroom)
        console.log("RoomName",result)
        req.body.message = true;
        res.status(200).send(req.body)
    }else{
        console.log("Chatroom already exsists")
        req.body.message = "exsists"
        res.send(req.body)
    }
}

async function check_chatroomName(chatroomName, req, res){
    await client.connect();
    const myCol = await client.db('express').collection("chatroomName");
    let doc = await myCol.findOne({chatroom:chatroomName})
    if(doc === null){
        req.body.message = true;
        res.status(200).send(req.body)
    }else{
        console.log("Chatroom already exsists")
        req.body.message = "exsists"
        res.send(req.body)
    }
}

async function delete_Chatroom(chatroomName) {
    await client.connect();
    const myCol = await client.db('express').collection("chatroomName");
    //Room holds the value of the ws name that was created and added to database
    let doc = await myCol.findOne({chatroom:chatroomName})
    await myCol.findOneAndDelete(doc)
}

// Declare wsInstance
const wsInstance = expressWs(app)

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

app.get("/",(req, res)=>{
    const welcomePage = path.resolve(__dirname + "/views/welcomePage.html")
    res.status(200).sendFile(welcomePage);
})

app.use("/user", user_routes)

app.get("/credit", (req, res)=>{
    let contributorList = require(path.resolve(__dirname + "/views/contributor.json"))
    console.log(contributorList)
    res.status(200).render("contributor.njk", {contributors: contributorList, title: "credit"})
})

app.get("/terms&conditions", (req, res)=>{
    let directory = path.resolve(__dirname + "/views/term&condition.txt")
    res.download(decodeURI(directory), (err)=>{
        console.log(err)
    })
})

// this will go to chatbox.njk. Which will create websocket chatroom if not exist, or join that chatroom if exist

app.get("/chatroom/:name", async (req, res)=>{
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
app.post("/createRoom", async (req, res)=>{
    let roomName = req.body.roomName;
    await check_add_chatroomName(roomName, req, res);
})

app.post("/joinRoom", async (req, res)=>{
    let roomName = req.body.roomName;
    await check_chatroomName(roomName, req, res);
})

app.post("/deleteChatroom", async (req, res)=>{
    let roomName = req.body.deleteChatroom;
    await delete_Chatroom(roomName);
})

// Catching fetch request for the room name
// let roomName = ''
// app.post('/roomName', (req, res)=>{
//     // Name of the room that user requested
//      roomName = Object.keys(req.body)[0];

// })

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
            delete_Chatroom(room);
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
