const mongoose = require('mongoose')
const hash = require("pbkdf2-password")();

const userSchema = new mongoose.Schema({
    user:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    salt:{
        type: String,
        required: true
    }
},{
    statics:{
        authentication(username, pw, callback){
            this.findOne({user:username}, (err, doc)=>{
                if(doc){
                    console.log('user found')
                    hash({password: pw, salt: doc.salt}, (err, pass, salt, hash)=>{
                        if(err) return err
                        if(hash === doc.password){
                            return callback(username)
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

async function seedUser(uri) {

    const newUser = new User({
        user: "Admin",
        password: "",
        salt: ""
    });

    hash({password: "SuperSecret"}, (err, pass, salt, hashed)=>{
        if (err) throw err;
        newUser.password = hashed;
        newUser.salt = salt;
    })

    await mongoose.connect(uri).catch(console.log);
    await mongoose.connection.db.dropCollection("userinfos")
    console.log("collection dropped")

    return result = await newUser.save()
    console.log("collection seeded")

}

module.exports ={
    User: User,
    seedUser: seedUser
}