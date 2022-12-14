const mongoose = require('mongoose')
const hash = require("pbkdf2-password")();

const userSchema = new mongoose.Schema({
    user:{
        type: String,
        required: true
    },
    hash:{
        type: String,
        required: true
    },
    salt:{
        type: String,
        required: true
    }
},{
    statics:{
        authentication(user, pw, callback){
            this.findOne({user:user}, (err, doc)=>{
                if(doc){
                    console.log('user found')
                    console.log("Salt: ", doc.salt)
                    hash({password: pw, salt: doc.salt}, (err, pass, salt, hash)=>{
                        if(err) return err
                        if(hash === doc.hash){
                            return callback(user)
                        }
                        else{
                            console.log('wrong password')
                            return callback(null)
                        }
                    })
                }
                else{
                    console.log("no user found")
                    return callback(null)
                }
            })
        }
    }
})

const User = mongoose.model('userinfo', userSchema)

async function seedUser(uri, username, password, isNewUser) {

    let newUser = {}
    if(isNewUser){
        newUser = new User({
            user: username,
            hash: "",
            salt: ""
        });
    }

    hash({password: password}, (err, pass, salt, hashed)=>{
        if (err) throw err;
        newUser.hash = hashed;
        newUser.salt = salt;
    })

    await mongoose.connect(uri).catch(console.log);
    // await mongoose.connection.db.dropCollection("userinfos")
    // console.log("collection dropped")

    return result =  await newUser.save()

}

//For now we are using this function. However we are goona bring the user functionality after tyhe mid term
async function check_add_name(username){
    await client.connect();
    const myCol = await client.db('express').collection("users");
    const doc = await myCol.findOne({user:username})
    if(doc === null){
        let newUser = {user:username}
        let result = await myCol.insertOne(newUser)
        console.log("User",result)
        req.body.message = true;
        res.status(200).send(req.body)
    }
    else{
        console.log("User already exsists")
        req.body.message = "User exsists"
        res.send(req.body)
    }
}

module.exports ={
    User: User,
    seedUser: seedUser
}