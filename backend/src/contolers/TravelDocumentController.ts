import express from 'express'
import TravelDocument from '../models/TravelDocument'

export class TravelDocumentController{


    addDocument=(req:express.Request, res:express.Response) =>{

        const documentNumber=req.body.documentNumber.trim().toUpperCase()

        TravelDocument.findOne({documentNumber:documentNumber}).then(existingDocument=>{

            if(existingDocument){
                res.json(null)
                return
            }

            TravelDocument.insertOne({firstName:req.body.firstName,lastName:req.body.lastName,documentType:req.body.documentType,documentNumber:documentNumber,nationality:req.body.nationality,dateOfBirth:req.body.dateOfBirth,sex:req.body.sex,expirationDate:req.body.expirationDate}).then(data=>{
                res.json(data._id.toString())
            })

        })

    }

    getDocumentById=(req:express.Request, res:express.Response) =>{
    
        TravelDocument.findOne({_id:req.body.id}).then(data=>{
            res.json(data)
        })
    
    }
    

    
}