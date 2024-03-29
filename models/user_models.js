const mongoose = require('mongoose')
const hash = require("pbkdf2-password")();
const {MONGODB} = require('../views/credentials')
const mongoUri = `mongodb+srv://${MONGODB.dai.user}:${MONGODB.dai.login}@${MONGODB.dai.cluster}/?retryWrites=true&w=majority`;

// create schema for client side validation for user collection
mongoose.connect(mongoUri)
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
        },
        findUser(user, callback){
            this.findOne({user:user}, (err, doc)=>{
                if(doc){  
                    console.log('user found')
                    return callback(user);
                }
                else{
                    console.log('user not found')
                    return callback(null);
                }
            })
        }
    }
})
// now create collection for users using written schema above
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

    return result =  await newUser.save()

}

module.exports ={
    User: User,
    seedUser: seedUser
}