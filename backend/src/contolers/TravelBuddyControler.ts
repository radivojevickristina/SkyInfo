import express from "express"
import * as countries from "i18n-iso-countries"


function convertToAlpha2(value:string):string{

    const code=String(value || "").trim().toUpperCase()
    if(code.length==2){
        return code
    }

    if(code.length==3){
        return (countries.alpha3ToAlpha2(code) ||"")
    }

    return ""
}


function getDateOnlyUtc(date:Date):number{

    return Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())
}


export class TravelBuddyControler {


    checkRequirements=(req:express.Request,res:express.Response)=>{

        const passport=convertToAlpha2(req.body.passport)
        const destination=convertToAlpha2(req.body.destination)
        const expirationDate=req.body.expirationDate
        const travelDate=req.body.travelDate

        if(passport=="" ||destination==""){

            res.json({message:"Država pasoša i destinacija nisu ispravne"})
            return
        }


        if(passport==destination){
            res.json({message:"Država pasoša i destinacija ne mogu biti iste"})
            return
        }


        const baseUrl=process.env.TRAVEL_BUDDY_BASE_URL
        const apiHost=process.env.TRAVEL_BUDDY_API_HOST
        const apiKey=process.env.TRAVEL_BUDDY_API_KEY


        if(!baseUrl ||!apiHost ||!apiKey){
            res.json({message:"Travel Buddy API nije podešen"})
            return
        }


        fetch(`${baseUrl}/v2/visa/check`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                        "application/json",

                    "X-RapidAPI-Key":
                        apiKey,

                    "X-RapidAPI-Host":
                        apiHost
                },

                body:JSON.stringify({
                    passport:passport,
                    destination:destination
                })
            }
        )
        .then(async response=>{

            const apiData=await response.json()
            if(!response.ok){
                res.json(apiData)
                return
            }


            let documentCheck:null | {
                validOnTravelDate:boolean
                daysRemaining:number
                expirationDate:string
                travelDate:string
            }=null


            if(expirationDate &&travelDate){
                const expiration=new Date(expirationDate)
                const travel=new Date(travelDate)

                if(!Number.isNaN(expiration.getTime()) &&!Number.isNaN(travel.getTime())){

                    const expirationUtc=getDateOnlyUtc(expiration)
                    const travelUtc=getDateOnlyUtc(travel)
                    const difference=expirationUtc-travelUtc

                    documentCheck={

                        validOnTravelDate:difference>=0,
                        daysRemaining:Math.floor(difference/86400000),
                        expirationDate:expirationDate,
                        travelDate:travelDate
                    }
                }
            }


            res.json({
                data:apiData.data,
                documentCheck:documentCheck
            })
        })
    }
}