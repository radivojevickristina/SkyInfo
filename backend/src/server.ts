import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import ruterBaza from './ruter/Ruter'
import "dotenv/config"

mongoose.connect("mongodb://localhost:27017/diplomski")
const conn=mongoose.connection
conn.once("open", ()=>{
    console.log("Uspesno povezivanje sa bazom")
})

const app = express()
app.use(cors())
app.use(express.json())

const ruter=express.Router()
ruter.use('/', ruterBaza)
app.use('/', ruter)

//app.get('/', (req, res)=> {res.send("Hello world!")})
app.listen(4000, ()=>console.log("Express running on port 4000!"))