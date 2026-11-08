import express from 'express'
import User from '../models/User'
import * as bcrypt from "bcryptjs"
import {sendAccountDeletedEmail} from "../services/EmailService"
import TravelDocument from '../models/TravelDocument'


export class UserControler{

    login=(req:express.Request,res:express.Response)=>{

        const enteredPassword=String(req.body.password || "")

        User.findOne({username:req.body.username}).then(user=>{

            if(!user){
                res.json(null)
                return
            }

            if(!user.password){
                res.json(null)
                return
            }

            bcrypt.compare(enteredPassword,user.password).then(passwordCorrect=>{

                if(!passwordCorrect){
                    res.json(null)
                    return
                }

                res.json(user)

            })

        })
    }

    register=(req:express.Request,res:express.Response)=>{

        if(!req.body.primaryTravelDocument || !req.body.primaryTravelDocument.documentNumber){
            res.json({message:"Primarni putni dokument je obavezan"})
            return
        }

        User.findOne({username:req.body.username}).then(existingUsername=>{

            if(existingUsername){
                res.json({message:"Korisničko ime je već zauzeto"})
                return
            }

            User.findOne({email:req.body.email}).then(existingEmail=>{

                if(existingEmail){
                    res.json({message:"Email adresa je već registrovana"})
                    return
                }

                User.findOne({"primaryTravelDocument.documentNumber":req.body.primaryTravelDocument.documentNumber}).then(existingDocument=>{

                    if(existingDocument){
                        res.json({message:"Dokument sa ovim brojem je već registrovan"})
                        return
                    }


                    bcrypt.hash(req.body.password,10).then(hashedPassword=>{

                        User.insertOne({
                            firstName:req.body.firstName,
                            lastName:req.body.lastName,
                            email:req.body.email,
                            username:req.body.username,
                            password:hashedPassword,
                            primaryTravelDocument:req.body.primaryTravelDocument,
                            secondaryTravelDocuments:req.body.secondaryTravelDocuments || [],
                            trackedFlights:req.body.trackedFlights || [],
                            admin:false
                        }).then(data=>{
                            console.log("KORISNIK DODAT:",data)
                            res.json(data)
                        }).catch(error=>{
                            console.log("GRESKA PRI DODAVANJU KORISNIKA:",error)
                            res.status(500).json({message:"Greška prilikom registracije"})
                        })

                    }).catch(error=>{
                        console.log("GRESKA BCRYPT:",error)
                        res.status(500).json({message:"Greška prilikom obrade lozinke"})
                    })

                })

            })

        })
    }

    addFlight=(req:express.Request,res:express.Response)=>{

        User.findByIdAndUpdate(req.body.userId,{trackedFlights:req.body.trackedFlights},{new:true}).then(data=>{
            res.json(data)
        })
    }

    addSecondaryDocument=(req:express.Request,res:express.Response)=>{

        
        User.findByIdAndUpdate(req.body.userId,{$push:{secondaryTravelDocuments:req.body.document}},{new:true}).then(data=>{
            res.json(data)
        })
    }

    deleteSecondaryDocument=(req:express.Request,res:express.Response)=>{

        User.findByIdAndUpdate(req.body.userId,{$pull:{secondaryTravelDocuments:{documentNumber:req.body.documentNumber}}},{new:true}).then(data=>{
            res.json(data)

        })
    }



    change=(req:express.Request,res:express.Response)=>{

        User.findOne({email:req.body.email,username:{$ne:req.body.username}}).then(existingEmail=>{

            if(existingEmail){
                res.json({message:"Email adresa je već registrovana"})
                return
            }

            User.findOneAndUpdate({username:req.body.username},{$set:{firstName:req.body.firstName,lastName:req.body.lastName,email:req.body.email,password:req.body.password}},{new:true}).then(data=>{
                if(!data){
                    res.json({message:"Korisnik nije pronađen"})
                    return
                }
                res.json(data)

            })

        })
    }


    changePassword=(req:express.Request,res:express.Response)=>{

        User.findOne({username:req.body.username}).then(user=>{

            if(!user || !user.password){
                res.json({message:"Stara lozinka nije tačna"})
                return
            }

            bcrypt.compare(req.body.oldPassword,user.password).then(passwordCorrect=>{

                if(!passwordCorrect){
                    res.json({message:"Stara lozinka nije tačna"})
                    return
                }

                bcrypt.hash(req.body.newPassword,10).then(hashedPassword=>{

                    User.findOneAndUpdate({username:req.body.username},{$set:{password:hashedPassword}},{new:true}).then(data=>{
                        res.json(data)
                    })
                })
            })
        })
    }


    changePrimaryDocument=(req:express.Request,res:express.Response)=>{

        if(!req.body.document || !req.body.document.documentNumber){
            res.json({message:"Dokument nije ispravan"})
            return
        }


        User.findOne({"primaryTravelDocument.documentNumber":req.body.document.documentNumber,_id:{$ne:req.body.username}}).then(existingDocument=>{

            if(existingDocument){
                res.json({message:"Dokument sa ovim brojem je već registrovan"})
                return
            }


            User.findByIdAndUpdate(req.body.username,{$set:{primaryTravelDocument:req.body.document}},{new:true}).then(data=>{

                if(!data){
                    res.json({message:"Korisnik nije pronađen"})
                    return
                }

                res.json(data)

            })

        })
    }


    updateTrackedFlights=(req:express.Request,res:express.Response)=>{

        if(!req.body.userId || !Array.isArray(req.body.trackedFlights)){
            res.status(400).json({message:"Nedostaju podaci"})
            return
        }

        User.findByIdAndUpdate(req.body.userId,{trackedFlights:req.body.trackedFlights},{new:true}).then(data=>{

            if(!data){
                res.status(404).json({message:"Korisnik nije pronađen"})
                return
            }

            res.json(data)

        })
    }

    getAllUsers=(req:express.Request,res:express.Response)=>{

        User.find({ admin: false }).then(data=>{
            res.json(data)
        })
    }


    deleteUser = (req: express.Request, res: express.Response) => {

        User.findById(req.body.id).then(user => {

            if (!user) {
                res.json({message: "Korisnik nije pronađen"})
                return
            }

            const documentNumber =user.primaryTravelDocument?.documentNumber

            User.deleteOne({_id: req.body.id}).then(data => {
                if (documentNumber) {
                    TravelDocument.deleteOne({documentNumber: documentNumber}).then(() => {

                        if (user.email && user.firstName) {

                            sendAccountDeletedEmail(user.email,user.firstName,"http://localhost:4200/register").then(() => {
                                res.json({message: "Korisnik i dokument su obrisani, email je poslat"})
                            })

                        } else {
                            res.json({message: "Korisnik i dokument su obrisani"})
                        }

                    })

                } else {
                     res.json({message: "Korisnik je obrisan, ali nema primarni dokument"})
                }

            })

        })
    }
    
}