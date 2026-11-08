import express from "express"
import * as crypto from "crypto"
import * as bcrypt from "bcryptjs"

import User from "../models/User"
import PasswordReset from "../models/PasswordReset"
import {sendPasswordResetEmail} from "../services/EmailService"

export class PasswordResetController {


    requestPasswordReset=(req:express.Request,res:express.Response)=>{

        const email=String(req.body.email || "").trim()

        if(email==""){

            res.status(400).json({
                message:"Email adresa je obavezna"
            })

            return
        }


        User.findOne({email:email}).then(user=>{

            if(!user){

                res.status(200).json({message:"Ako nalog sa ovom email adresom postoji, link za promenu lozinke je poslat."})
                return
            }


            PasswordReset.deleteMany({userId:user._id.toString()}).then(()=>{

                const token=crypto.randomBytes(32).toString("hex")
                const tokenHash=crypto.createHash("sha256").update(token).digest("hex")
                const expiresAt=new Date(Date.now()+15*60*1000)

                PasswordReset.insertOne({userId:user._id.toString(),tokenHash:tokenHash,expiresAt:expiresAt,createdAt:new Date()}).then(()=>{

                    const frontendUrl=process.env.FRONTEND_URL ||"http://localhost:4200"
                    const resetLink=`${frontendUrl}/reset-password?token=${token}`

                    sendPasswordResetEmail(String(user.email || ""),resetLink).then(()=>{
                        res.status(200).json({message:"Ako nalog sa ovom email adresom postoji, link za promenu lozinke je poslat."})
                    }).catch(error=>{


                        PasswordReset.deleteMany({userId:user._id.toString()}).then(()=>{
                            res.status(500).json({message:"Greška prilikom slanja emaila"})
                        })
                    })

                })

            })

        })
    }



    validateToken=(req:express.Request,res:express.Response)=>{

        const token=String(req.params.token || "")

        if(!token){
            res.status(400).json({valid:false})
            return
        }


        const tokenHash=crypto.createHash("sha256").update(token).digest("hex")

        PasswordReset.findOne({tokenHash:tokenHash,expiresAt:{$gt:new Date()}}).then(resetData=>{

            if(!resetData){

                res.status(400).json({valid:false})
                return
            }
            res.status(200).json({valid:true})

        })
    }



    resetPassword=(req:express.Request,res:express.Response)=>{

        const token=String(req.body.token || "")
        const newPassword=String(req.body.newPassword || "")


        if(!token || !newPassword){

            res.status(400).json({message:"Nedostaju potrebni podaci"})
            return
        }


        if(!this.checkPassword(newPassword)){

            res.status(400).json({message:"Lozinka ne ispunjava uslove"})
            return
        }


        const tokenHash=crypto.createHash("sha256").update(token).digest("hex")

        PasswordReset.findOne({tokenHash:tokenHash,expiresAt:{$gt:new Date()}}).then(resetData=>{

            if(!resetData){
                res.status(400).json({message:"Link nije važeći ili je istekao"})
                return
            }


            bcrypt.hash(newPassword,10).then(hashedPassword=>{User.updateOne({_id:resetData.userId},{$set:{password:hashedPassword}}).then(()=>{

                    PasswordReset.deleteMany({userId:resetData.userId}).then(()=>{
                        res.status(200).json({success:true})
                    })

                })

            })
        })
    }



    checkPassword=(password:string):boolean=>{

        if(password.length<8 || password.length>12){
            return false
        }

        if(!/^[a-zA-Z]/.test(password)){
            return false
        }

        if(!/[A-Z]/.test(password)){
            return false
        }

        if(!/\d/.test(password)){
            return false
        }

        if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)){
            return false
        }

        return true
    }

}