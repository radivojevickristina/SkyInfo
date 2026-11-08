import { Flights } from "./Flights";
import { TravelDocument } from "./TravelDocument";

export class User {
    _id:string="";
    firstName: string = "";
    lastName: string = "";
    email: string = "";
    username:string="";
    password:string="";
    primaryTravelDocument:TravelDocument=new TravelDocument();
    secondaryTravelDocuments:Array<TravelDocument>=new Array();
    trackedFlights:Array<Flights>=new Array();
    admin:boolean=false;
}