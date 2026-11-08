import mongoose from "mongoose"

let Notification=new mongoose.Schema({
    userId: {
        type: String,
        default: null
    },
    
    type:{
        type:String,
        enum:[
            "flight_status",
            "gate_change",
            "flight_delay",
            "flight_cancelled",
            "document_expiration",
            "general",
            "terminal_closure",
            "airport_entrance_closure",
            "airport_area_closure",
            "airport_maintenance",
            "airport_general"
        ]
    },
    severity:{
        type:String,
        enum:[
            "info",
            "warning",
            "critical"
        ]
    },
    titleKey:String,
    messageKey:String,
    params:Object,
    uniqueKey:String,
    read:Boolean,
    readAt:Date,
    actionRoute:String,
    createdAt:Date

})

export default mongoose.model("NotificationModel", Notification, "notification")