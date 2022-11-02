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

const app = express();
const port = 5000;

app.use("/files", serveIndex(__dirname+"views", {icons: true}))
app.use('/public', express.static(__dirname+"/views"))
app.use(express.urlencoded({extended:true}))

// app.get('/files')
//put our mongodb uri here
const mongoUri = "mongodb+srv://dai:09022002@cluster0.esqge8e.mongodb.net/?retryWrites=true&w=majority";
const client = new mongodb.MongoClient(mongoUri);

async function check_add_name(username){
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
    let user = req.body.user;
    let roomName = req.body.roomName;
    await check_add_chatroomName(roomName, req, res);
})

app.post("/formhandler2", (req, res)=>{

})


app.post('/roomName', (req, res)=>{
    // Name of the room that user requested
    let room = Object.keys(req.body)[0];
    app.ws(`/chatroom/${room}`, async (ws, req)=>{
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
            await client.connect();
            const myCol = await client.db('express').collection("chatroomName");
            //Room holds the value of the ws name that was created and added to database
            let doc = await myCol.findOne({chatroom:room})
            await myCol.findOneAndDelete(doc)
        })
    
    })
    
})


let mimeLookup = {
    ".html" : "text/html",
    ".jpg": "image/jpeg",
    ".js": "application/javascript",
    ".png" : "image/png"
}

app.post("/chatroom/fileUpload",(req, res)=>{
    let response = "";
    let form = new multiparty.Form({autoFields:true})
    form.on('part', (part)=>{
        
        let partName = part.filename
        let part_ext = path.extname(partName)
        let partType = mimeLookup[part_ext]
        if(!partType){
            part.resume();
            response = "This file type is not supported"
            return
        }
        if (part.name !== "filename"){
            part.resume();
            return
        }
        // if(part.byteCount > 3000000){
        //     part.resume();
        //     response = "This file is too large"
        //     return
        // }

        part.pipe(fs.createWriteStream(path.join('./public' , part.filename)))

        
        response = `file with name ${part.filename} saved`
    })
    form.on("close", ()=>{
        res.send(response)
    })
    form.parse(req)
})

app.use((req,res) =>{
    res.status(404).sendFile(__dirname + "/views/404.html")
    
})

app.listen(port)