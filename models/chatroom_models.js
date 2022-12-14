//put our mongodb uri here
const mongodb = require("mongodb");
// const mongoUri1 = "mongodb://localhost:27017";
const {MONGODB} = require('../views/credentials')
const mongoUri = `mongodb+srv://${MONGODB.dai.user}:${MONGODB.dai.login}@${MONGODB.dai.cluster}/?retryWrites=true&w=majority`;
const client = new mongodb.MongoClient(mongoUri);


async function serverSideSchemaChatroom(){
    await client.connect();
    const db = client.db('express');
    await db.createCollection('chatroomName', {
        validator:{
            $jsonSchema:{
                bsonType: "object",
                title: "Server-side Validation",
                required: ['_id', "chatroom"],
                additionalProperties: false,
                properties:{
                    _id: {},
                    chatroom:{
                        bsonType: "string",
                        description: "Variable Name"
                    }
                }
            }
        }
    });
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

module.exports = {
    delete_Chatroom: delete_Chatroom,
    check_add_chatroomName: check_add_chatroomName,
    check_chatroomName: check_chatroomName,
    serverSideSchemaChatroom: serverSideSchemaChatroom
}