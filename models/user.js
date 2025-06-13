const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose= require("passport-local-mongoose")

const userSchema = new Schema({
    email:{
        type: String,
        required:true
    },
    // Username and password will be added by passport-local-mongoose automatically 
    // (Username and password will be automatically defined by passport-local-mongoose)
    // Weather we mention it in fields or not
})

userSchema.plugin(passportLocalMongoose)
// This will add username Hashing, Salting and Hased password fields to the userSchema automatically, So we don't need to define them explicitly.
// It will also add methods like authenticate, serializeUser, deserializeUser etc.

module.exports= mongoose.model("User", userSchema);
// This will create a User model with email, username and password fields