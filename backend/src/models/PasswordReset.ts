import mongoose from "mongoose"

let PasswordReset=new mongoose.Schema({

    userId:String,
    tokenHash:String,
    expiresAt:Date,
    createdAt:{
        type:Date,
        default:Date.now
    }

})

PasswordReset.index({expiresAt:1},{expireAfterSeconds:0})

export default mongoose.model("PasswordResetModel",PasswordReset,"password_reset")