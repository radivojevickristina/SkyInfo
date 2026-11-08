import {Component,inject,OnInit} from '@angular/core'
import {ActivatedRoute,Router} from '@angular/router'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {User} from '../models/User'
import {TravelDocument} from '../models/TravelDocument'
import {Flights} from '../models/Flights'

@Component({
  selector:'app-user-flights',
  imports:[CommonModule,FormsModule,TranslatePipe],
  templateUrl:'./user-flights.html',
  styleUrl:'./user-flights.css',
})
export class UserFlights implements OnInit {

  route=inject(ActivatedRoute)
  ruter=inject(Router)
  translate=inject(TranslateService)

  user=new User()
  primaryDocument=new TravelDocument()
  flightsForDisplay:Flights[]=[]
  trackedFlights:Flights[]=[]
  selectedFlight:Flights | null=null
  profileMenuOpen=false
  currentLanguage="sr"

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]
  spanishLanguageNationalities=["ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM","ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER","URY","VEN"]

  ngOnInit():void{

    const loggedUser=localStorage.getItem("loggedUser")

    if(!loggedUser){
      this.ruter.navigate(["/login"])
      return
    }

    this.user=JSON.parse(loggedUser)
    this.primaryDocument=this.user.primaryTravelDocument

    const lang=localStorage.getItem("language")
    if(lang){
      this.currentLanguage=lang
      this.translate.use(this.currentLanguage)
    }

    this.flightsForDisplay=[...(this.user.trackedFlights || [])].sort((a,b)=>{
      return this.getDepartureTimeValue(a)-this.getDepartureTimeValue(b)
    })

    this.trackedFlights=[...(this.user.trackedFlights || [])].sort((a,b)=>{
      return this.getDepartureTimeValue(a)-this.getDepartureTimeValue(b)
    })

    const selectedFlightNumber=this.route.snapshot.queryParamMap.get("flightNumber")
    const selectedDepartureTime=this.route.snapshot.queryParamMap.get("departureTime")

    if(selectedFlightNumber){

      const flight=this.trackedFlights.find(currentFlight=>{

        const currentFlightNumber=currentFlight.flightNumber || currentFlight.callsign

        return currentFlightNumber===selectedFlightNumber && (!selectedDepartureTime || currentFlight.departureScheduledTime===selectedDepartureTime)
      })

      if(flight){
        this.openFlight(flight)
      }
    }
  }

  getLanguageByNationality(nationality:string):string{

    const normalizedNationality=String(nationality || "").trim().toUpperCase()

    if(this.serbianLanguageNationalities.includes(normalizedNationality)){
      return "sr"
    }

    if(this.spanishLanguageNationalities.includes(normalizedNationality)){
      return "es"
    }

    return "en"
  }

  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
  }

  getDepartureTimeValue(flight:Flights):number{

    if(!flight.departureScheduledTime){
      return Number.MAX_SAFE_INTEGER
    }

    const time=new Date(flight.departureScheduledTime).getTime()

    if(Number.isNaN(time)){
      return Number.MAX_SAFE_INTEGER
    }

    return time
  }

  openFlight(flight:Flights){
    this.selectedFlight=flight
  }

  closeFlight(){
    this.selectedFlight=null
  }

  getFlightStatusKey(status:string):string{

    const normalizedStatus=String(status || "").replace(/[\s_-]/g,"").toLowerCase()

    const statuses:Record<string,string>={
      expected:"FLIGHT_STATUS.EXPECTED",
      enroute:"FLIGHT_STATUS.EN_ROUTE",
      checkin:"FLIGHT_STATUS.CHECK_IN",
      boarding:"FLIGHT_STATUS.BOARDING",
      gateclosed:"FLIGHT_STATUS.GATE_CLOSED",
      departed:"FLIGHT_STATUS.DEPARTED",
      delayed:"FLIGHT_STATUS.DELAYED",
      approaching:"FLIGHT_STATUS.APPROACHING",
      arrived:"FLIGHT_STATUS.ARRIVED",
      canceled:"FLIGHT_STATUS.CANCELED",
      cancelled:"FLIGHT_STATUS.CANCELED",
      diverted:"FLIGHT_STATUS.DIVERTED",
      canceleduncertain:"FLIGHT_STATUS.CANCELED_UNCERTAIN",
      cancelleduncertain:"FLIGHT_STATUS.CANCELED_UNCERTAIN"
    }

    return statuses[normalizedStatus] || "FLIGHT_STATUS.UNAVAILABLE"
  }

  getFlightDuration(flight:Flights):string{

    if(!flight.departureScheduledTime || !flight.arrivalScheduledTime){
      return "-"
    }

    const departure=new Date(flight.departureScheduledTime).getTime()
    const arrival=new Date(flight.arrivalScheduledTime).getTime()
    const difference=arrival-departure

    if(difference<=0 || Number.isNaN(difference)){
      return "-"
    }

    const totalMinutes=Math.floor(difference/60000)
    const hours=Math.floor(totalMinutes/60)
    const minutes=totalMinutes%60

    if(hours==0){
      return this.translate.instant("COMMON.MINUTES_SHORT",{count:minutes})
    }

    if(minutes==0){
      return this.translate.instant("COMMON.HOURS_SHORT",{count:hours})
    }

    return this.translate.instant("COMMON.HOURS_MINUTES_SHORT",{hours:hours,minutes:minutes})
  }

  toggleProfileMenu(){
    this.profileMenuOpen=!this.profileMenuOpen
  }

  closeProfileMenu(){
    this.profileMenuOpen=false
  }

  odjaviSe(){
    localStorage.removeItem("loggedUser")
    this.ruter.navigate(["login"])
  }
}
