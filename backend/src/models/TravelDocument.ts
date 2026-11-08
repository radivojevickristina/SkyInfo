import mongoose from "mongoose";

let TravelDocument=new mongoose.Schema({
    firstName:String,
    lastName:String,
    documentType:String,
    documentNumber:String,
    nationality:String,
    dateOfBirth:Date,
    sex:String,
    expirationDate:Date
})

export default mongoose.model("TravelDocumentModel", TravelDocument, "travelDocument")