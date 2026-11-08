import express from "express"
import Notification from "../models/Notification"

export class NotificationController {

    addNotification=(req:express.Request,res:express.Response)=>{

        if( !req.body.type || !req.body.titleKey || !req.body.messageKey || !req.body.uniqueKey){
            res.json({message:"Nedostaju obavezni podaci za obaveštenje"})
            return
        }

        Notification.findOne({userId:req.body.userId,uniqueKey:req.body.uniqueKey}).then(existingNotification=>{

            if(existingNotification){
                res.json({message:"Obaveštenje već postoji"})
                return
            }

            Notification.insertOne({userId:req.body.userId,type:req.body.type,severity:req.body.severity || "info",titleKey:req.body.titleKey,messageKey:req.body.messageKey,params:req.body.params || {},uniqueKey:req.body.uniqueKey,read:false,readAt:null,actionRoute:req.body.actionRoute || "",createdAt:new Date()}).then(data=>{
                res.json(data)

            })

        })
    }



    getNotificationsByUserId=(req:express.Request,res:express.Response)=>{

        Notification.find({
            $or:[
                {userId:req.params.userId},
                {userId:null}
            ]
        })
        .sort({createdAt:-1})
        .then(data=>{
            res.json(data)
        })
        .catch(error=>{
            console.log(error)
            res.status(500).json({message:"Greška prilikom dohvatanja obaveštenja"})
        })
    }

    markAsRead=(req:express.Request,res:express.Response)=>{

        Notification.findOneAndUpdate({_id:req.params.notificationId,userId:req.body.userId},{$set:{read:true,readAt:new Date()}},{new:true}).then(notification=>{

            if(!notification){
                res.json({message:"Obaveštenje nije pronađeno"})
                return
            }

            res.json(notification)

        })
    }
}