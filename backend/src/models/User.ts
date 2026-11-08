import mongoose from "mongoose";
import TravelDocument from "./TravelDocument";

let User=new mongoose.Schema({
    firstName:String,
    lastName:String,
    email:String,
    username:String,
    password:String,
    primaryTravelDocument:TravelDocument.schema,
    secondaryTravelDocuments:[TravelDocument.schema],
    trackedFlights:Array,
    admin:Boolean
})

export default mongoose.model("UserModel", User, "user")