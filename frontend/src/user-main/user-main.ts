import {Component,inject,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {Router, RouterLink} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {User} from '../models/User'
import {TravelDocument} from '../models/TravelDocument'
import {Flights} from '../models/Flights'
import {Airport} from '../models/Airport'
import {AeroDataBoxService} from '../services/aero-data-box-service'
import {UserService} from '../services/user-service'
import { NotificationService } from '../services/notification-service'
import { Notification } from '../models/Notification'
import {BrowserMultiFormatReader} from '@zxing/browser'

@Component({
  selector:'app-user-main',
  imports:[CommonModule,FormsModule,TranslatePipe, RouterLink],
  templateUrl:'./user-main.html',
  styleUrl:'./user-main.css'
})
export class UserMain implements OnInit {

  userService=inject(UserService)
  flightService=inject(AeroDataBoxService)
  router=inject(Router)
  translate=inject(TranslateService)
  notificationService=inject(NotificationService)

  user=new User()
  primaryDocument=new TravelDocument()

  today=new Date()

  currentLanguage="sr"
  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]
  spanishLanguageNationalities=["ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM","ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER","URY","VEN"]

  searchResults:Flights[]=[]
  flightsForDisplay:Flights[]=[]
  trackedFlights:Flights[]=[]
  nextFlight:Flights | null=null

  messageKey=""
  isLoading=false

  isBoardingPassLoading=false
  boardingPassReader=new BrowserMultiFormatReader()

  flightNumber=""
  flightDate=""

  departureAirportText=""
  arrivalAirportText=""

  selectedDepartureAirport:Airport | null=null
  selectedArrivalAirport:Airport | null=null

  departureAirportSuggestions:Airport[]=[]
  arrivalAirportSuggestions:Airport[]=[]
  allNotifications:Notification[]=[]

  departureSearchTimer:ReturnType<typeof setTimeout> | null=null
  arrivalSearchTimer:ReturnType<typeof setTimeout> | null=null

  profileMenuOpen=false



  ngOnInit():void{

    const loggedUser=localStorage.getItem("loggedUser")

    if(!loggedUser){
      this.router.navigate(["/login"])
      return
    }

    this.user=JSON.parse(loggedUser)
    this.user.trackedFlights=this.user.trackedFlights || []
    this.user.secondaryTravelDocuments=this.user.secondaryTravelDocuments || []
    this.primaryDocument=this.user.primaryTravelDocument

    const lang=localStorage.getItem("language")
    if(lang){
      this.currentLanguage=lang
      this.translate.use(this.currentLanguage)
    }

    this.notificationService.getNotificationsByUserId(this.user._id).subscribe(data=>{
      if(data){
        this.allNotifications=data
      }
    })

    this.flightsForDisplay=[...this.user.trackedFlights].sort((a,b)=>{
      return this.getDepartureTimeValue(a)-this.getDepartureTimeValue(b)
    })

    this.trackedFlights=[...this.user.trackedFlights].sort((a,b)=>{
      return this.getDepartureTimeValue(a)-this.getDepartureTimeValue(b)
    })

    const now=Date.now()

    for(const currentFlight of this.user.trackedFlights){

      const currentDateTime=this.getDepartureTimeValue(currentFlight)

      if(currentDateTime==Number.MAX_SAFE_INTEGER || currentDateTime<=now){
        continue
      }

      if(!this.nextFlight || currentDateTime<this.getDepartureTimeValue(this.nextFlight)){
        this.nextFlight=currentFlight
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

  isDocumentValid(expirationDate:Date | string | null | undefined):boolean{

    if(!expirationDate){
      return false
    }

    const expiration=new Date(expirationDate)

    if(Number.isNaN(expiration.getTime())){
      return false
    }

    const today=new Date()
    const expirationOnly=Date.UTC(expiration.getUTCFullYear(),expiration.getUTCMonth(),expiration.getUTCDate())
    const todayOnly=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate())

    return expirationOnly>=todayOnly
  }

  getDocumentTypeKey(documentType:string):string{

    const normalizedType=String(documentType || "").trim().toLowerCase()

    if(normalizedType=="passport"){
      return "COMMON.PASSPORT"
    }

    if(normalizedType=="identitycard"){
      return "COMMON.IDENTITY_CARD"
    }

    return "COMMON.NOT_AVAILABLE"
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

  openTrackedFlight(flight:Flights){

    this.router.navigate(
      ["/user/flights"],
      {
        queryParams:{
          flightNumber:flight.flightNumber || flight.callsign,
          departureTime:flight.departureScheduledTime
        }
      }
    )
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

  onDepartureAirportInput(){

    this.selectedDepartureAirport=null

    if(this.departureSearchTimer){
      clearTimeout(this.departureSearchTimer)
    }

    const query=this.departureAirportText.trim()

    if(query.length<3){
      this.departureAirportSuggestions=[]
      return
    }

    this.departureSearchTimer=setTimeout(()=>{

      this.flightService.searchAirports(query).subscribe({
        next:data=>{
          this.departureAirportSuggestions=data || []
        },
        error:error=>{
          console.log("Departure airport search error:",error)
          this.departureAirportSuggestions=[]
        }
      })
    },350)
  }

  selectDepartureAirport(airport:Airport){

    this.selectedDepartureAirport=airport
    this.departureAirportText=airport.city+" ("+(airport.iata || airport.icao)+") — "+airport.name
    this.departureAirportSuggestions=[]
  }

  onArrivalAirportInput(){

    this.selectedArrivalAirport=null

    if(this.arrivalSearchTimer){
      clearTimeout(this.arrivalSearchTimer)
    }

    const query=this.arrivalAirportText.trim()

    if(query.length<3){
      this.arrivalAirportSuggestions=[]
      return
    }

    this.arrivalSearchTimer=setTimeout(()=>{

      this.flightService.searchAirports(query).subscribe({
        next:data=>{
          this.arrivalAirportSuggestions=data || []
        },
        error:error=>{
          console.log("Arrival airport search error:",error)
          this.arrivalAirportSuggestions=[]
        }
      })
    },350)
  }

  selectArrivalAirport(airport:Airport){

    this.selectedArrivalAirport=airport
    this.arrivalAirportText=airport.city+" ("+(airport.iata || airport.icao)+") — "+airport.name
    this.arrivalAirportSuggestions=[]
  }

  searchFlights(){

    this.searchResults=[]
    this.messageKey=""

    if(this.departureAirportText.trim()!="" && !this.selectedDepartureAirport){
      this.messageKey="FLIGHT_SEARCH.ERROR_SELECT_DEPARTURE"
      return
    }

    if(this.arrivalAirportText.trim()!="" && !this.selectedArrivalAirport){
      this.messageKey="FLIGHT_SEARCH.ERROR_SELECT_ARRIVAL"
      return
    }

    if(this.flightNumber.trim()=="" && this.flightDate.trim()=="" && !this.selectedDepartureAirport && !this.selectedArrivalAirport){
      this.messageKey="FLIGHT_SEARCH.ERROR_CRITERIA"
      return
    }

    if(this.flightDate.trim()!="" && this.flightNumber.trim()=="" && !this.selectedDepartureAirport && !this.selectedArrivalAirport){
      this.messageKey="FLIGHT_SEARCH.ERROR_DATE_WITH_CRITERIA"
      return
    }

    this.isLoading=true
    this.departureAirportSuggestions=[]
    this.arrivalAirportSuggestions=[]

    this.flightService.searchFlights(
      this.flightNumber,
      this.flightDate,
      this.selectedDepartureAirport?.iata || this.selectedDepartureAirport?.icao || "",
      this.selectedArrivalAirport?.iata || this.selectedArrivalAirport?.icao || ""
    ).subscribe({
      next:data=>{

        this.searchResults=data?.flights || []

        if(this.searchResults.length==0){
          this.messageKey="FLIGHT_SEARCH.NO_RESULTS"
        }

        this.isLoading=false
      },
      error:error=>{
        console.log("Flight search error:",error)
        this.messageKey="API_ERRORS.AERODATABOX_ACCESS"
        this.isLoading=false
      }
    })
  }

  clearFlightSearch(){

    this.flightNumber=""
    this.flightDate=""
    this.departureAirportText=""
    this.arrivalAirportText=""
    this.selectedDepartureAirport=null
    this.selectedArrivalAirport=null
    this.departureAirportSuggestions=[]
    this.arrivalAirportSuggestions=[]
    this.searchResults=[]
    this.messageKey=""
    this.isLoading=false
  }

  trackFlight(flight:Flights){

    this.messageKey=""

    const flightNumber=(flight.flightNumber || flight.callsign || "").replace(/\s/g,"").toUpperCase()
    const departureAirport=(flight.departureAirportIata || this.selectedDepartureAirport?.iata || flight.departureAirport || this.selectedDepartureAirport?.icao || "").trim().toUpperCase()
    const arrivalAirport=(flight.arrivalAirportIata || this.selectedArrivalAirport?.iata || flight.arrivalAirport || this.selectedArrivalAirport?.icao || "").trim().toUpperCase()
    const departureTime=flight.departureScheduledTimeUtc || flight.departureScheduledTime || ""

    if(flightNumber=="" || departureAirport=="" || arrivalAirport=="" || departureTime==""){
      this.messageKey="FLIGHT_SEARCH.NOT_ENOUGH_DATA"
      return
    }

    const flightForSaving:Flights={
      ...flight,
      externalKey:flightNumber+"|"+departureTime+"|"+departureAirport+"|"+arrivalAirport,
      flightNumber:flightNumber,
      departureCity:flight.departureCity || this.selectedDepartureAirport?.city || "",
      departureAirportIata:flight.departureAirportIata || this.selectedDepartureAirport?.iata || "",
      departureAirport:flight.departureAirport || this.selectedDepartureAirport?.icao || "",
      arrivalCity:flight.arrivalCity || this.selectedArrivalAirport?.city || "",
      arrivalAirportIata:flight.arrivalAirportIata || this.selectedArrivalAirport?.iata || "",
      arrivalAirport:flight.arrivalAirport || this.selectedArrivalAirport?.icao || ""
    }

    const alreadyTracked=this.trackedFlights.some((trackedFlight:Flights)=>{
      return trackedFlight.externalKey==flightForSaving.externalKey
    })

    if(alreadyTracked){
      this.messageKey="FLIGHT_SEARCH.TRACKING_ENABLED"
      return
    }

    const flights=[...this.trackedFlights,flightForSaving]

    this.userService.addFlight(this.user._id,flights).subscribe({
      next:newUser=>{

        if(!newUser){
          this.messageKey="FLIGHT_SEARCH.SAVED_NOT_ADDED"
          return
        }

        this.user=newUser
        this.user.trackedFlights=this.user.trackedFlights || []
        this.trackedFlights=[...this.user.trackedFlights]
        this.flightsForDisplay=[...this.user.trackedFlights].sort((a,b)=>{
          return this.getDepartureTimeValue(a)-this.getDepartureTimeValue(b)
        })

        localStorage.setItem("loggedUser",JSON.stringify(newUser))
        this.messageKey="FLIGHT_SEARCH.ADDED_TO_TRACKED"

        const now=Date.now()
        for(const currentFlight of this.user.trackedFlights){

          const currentDateTime=this.getDepartureTimeValue(currentFlight)

          if(currentDateTime==Number.MAX_SAFE_INTEGER || currentDateTime<=now){
            continue
          }

          if(!this.nextFlight || currentDateTime<this.getDepartureTimeValue(this.nextFlight)){
            this.nextFlight=currentFlight
          }
        }

      },
      error:error=>{
        console.log("Flight tracking error:",error)
        this.messageKey="FLIGHT_SEARCH.SAVED_NOT_ADDED"
      }
    })
  }

  isFlightTracked(flight:Flights):boolean{

    const flightNumber=(flight.flightNumber || flight.callsign || "").replace(/\s/g,"").toUpperCase()
    const departureAirport=(flight.departureAirportIata || this.selectedDepartureAirport?.iata || flight.departureAirport || this.selectedDepartureAirport?.icao || "").trim().toUpperCase()
    const arrivalAirport=(flight.arrivalAirportIata || this.selectedArrivalAirport?.iata || flight.arrivalAirport || this.selectedArrivalAirport?.icao || "").trim().toUpperCase()
    const departureTime=flight.departureScheduledTimeUtc || flight.departureScheduledTime || ""
    const externalKey=flightNumber+"|"+departureTime+"|"+departureAirport+"|"+arrivalAirport

    return this.trackedFlights.some(trackedFlight=>trackedFlight.externalKey==externalKey)
  }

  openBoardingPassUpload(input:HTMLInputElement){
    input.click()
  }

  scanBoardingPass(event:Event){

    const input=event.target as HTMLInputElement
    const file=input.files?.[0]

    if(!file){
      return
    }

    this.messageKey=""
    this.isBoardingPassLoading=true

    const imageUrl=URL.createObjectURL(file)

    this.boardingPassReader.decodeFromImageUrl(imageUrl).then(result=>{

      const rawData=result.getText()

      console.log("Boarding pass raw data:",rawData)

      URL.revokeObjectURL(imageUrl)

      this.isBoardingPassLoading=false
      input.value=""

      this.fillFlightSearchFromBoardingPass(rawData)

    }).catch(error=>{

      console.log("Boarding pass scan error:",error)

      URL.revokeObjectURL(imageUrl)

      this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_NOT_READ"
      this.isBoardingPassLoading=false
      input.value=""
    })
  }

  fillFlightSearchFromBoardingPass(rawData:string){

    if(!rawData || rawData.length<47){
      this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_INVALID"
      return
    }

    try{

      const cleanData = rawData.replace(/[\r\n]/g, "")

      if (!cleanData.startsWith("M") || cleanData.length < 47) {
        return
      }

      const departureAirport=rawData.substring(30,33).trim()
      const arrivalAirport=rawData.substring(33,36).trim()
      const airlineCode=rawData.substring(36,39).trim()
      const flightNumber=rawData.substring(39,44).trim()
      const julianDate=rawData.substring(44,47).trim()

      this.flightNumber=(airlineCode+flightNumber).replace(/\s/g,"")
      this.flightDate=this.getDateFromJulianDay(julianDate)

      this.findBoardingPassAirports(
        departureAirport,
        arrivalAirport
      )

    }catch(error){

      console.log("Boarding pass parse error:",error)

      this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_INVALID"
    }
  }

  findBoardingPassAirports(departureIata:string,arrivalIata:string){

    this.flightService.searchAirports(departureIata).subscribe({
      next:departureAirports=>{

        const departureAirport=departureAirports.find((airport:Airport)=>{
          return airport.iata?.toUpperCase()==departureIata.toUpperCase()
        })

        if(!departureAirport){
          this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_AIRPORT_NOT_FOUND"
          return
        }

        this.selectedDepartureAirport=departureAirport

        this.departureAirportText=departureAirport.city+" ("+(departureAirport.iata || departureAirport.icao)+") — "+departureAirport.name


        this.flightService.searchAirports(arrivalIata).subscribe({
          next:arrivalAirports=>{

            if (!Array.isArray(arrivalAirports)) {
              console.log("AeroDataBox error:", arrivalAirports)
              return
            }

            const arrivalAirport=arrivalAirports.find((airport:Airport)=>{
              return airport.iata?.toUpperCase()==arrivalIata.toUpperCase()
            })

            if(!arrivalAirport){
              this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_AIRPORT_NOT_FOUND"
              return
            }

            this.selectedArrivalAirport=arrivalAirport

            this.arrivalAirportText=arrivalAirport.city+" ("+(arrivalAirport.iata || arrivalAirport.icao)+") — "+arrivalAirport.name


            this.departureAirportSuggestions=[]
            this.arrivalAirportSuggestions=[]
            this.messageKey=""

         
          },
          error:error=>{

            console.log("Arrival airport boarding pass error:",error)

            this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_AIRPORT_NOT_FOUND"
          }
        })
      },
      error:error=>{

        console.log("Departure airport boarding pass error:",error)

        this.messageKey="FLIGHT_SEARCH.BOARDING_PASS_AIRPORT_NOT_FOUND"
      }
    })
  }


  getDateFromJulianDay(julianDay:string):string{

    const dayNumber=Number(julianDay)

    if(!dayNumber || dayNumber<1 || dayNumber>366){
      return ""
    }

    const today=new Date()
    let year=today.getFullYear()

    let date=new Date(year,0,dayNumber)

    const difference=date.getTime()-today.getTime()

    if(difference<-1000*60*60*24*180){
      year++
      date=new Date(year,0,dayNumber)
    }

    const month=String(date.getMonth()+1).padStart(2,"0")
    const day=String(date.getDate()).padStart(2,"0")

    return year+"-"+month+"-"+day
  }



  odjaviSe(){
    localStorage.removeItem("loggedUser")
    this.router.navigate(["login"])
  }
}
