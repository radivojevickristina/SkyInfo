import {Component,inject,OnDestroy,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {RouterLink} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'

import {AeroDataBoxService} from '../services/aero-data-box-service'
import { Airport } from '../models/Airport'

@Component({
  selector:'app-guest-main',
  imports:[CommonModule,FormsModule,RouterLink,TranslatePipe],
  templateUrl:'./guest-main.html',
  styleUrl:'./guest-main.css',
})
export class GuestMain implements OnInit,OnDestroy {

  servisLetovi=inject(AeroDataBoxService)
  translate=inject(TranslateService)

  currentLanguage="sr"

  sviLetovi:any[]=[]
  messageKey=""
  isLoading=false

  flightNumber=""
  flightDate=""

  departureAirportText=""
  arrivalAirportText=""

  selectedDepartureAirport:Airport | null=null
  selectedArrivalAirport:Airport | null=null

  departureAirportSuggestions:Airport[]=[]
  arrivalAirportSuggestions:Airport[]=[]

  departureSearchTimer:ReturnType<typeof setTimeout> | null=null
  arrivalSearchTimer:ReturnType<typeof setTimeout> | null=null


  ngOnInit(){

    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es" || savedLanguage=="tr"){
      this.currentLanguage=savedLanguage
    }
    else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
  }


  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es" && language!="tr"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
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

      this.servisLetovi.searchAirports(query).subscribe(data=>{
        if(data){
          this.departureAirportSuggestions=data || []
        }
        else{
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

      this.servisLetovi.searchAirports(query).subscribe(data=>{
        if(data){
          this.arrivalAirportSuggestions=data || []
        }
        else{
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

    this.sviLetovi=[]
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

    this.servisLetovi.searchFlights(
      this.flightNumber,
      this.flightDate,
      this.selectedDepartureAirport?.iata || this.selectedDepartureAirport?.icao || "",
      this.selectedArrivalAirport?.iata || this.selectedArrivalAirport?.icao || ""
    ).subscribe(data=>{
      if(data){

        this.sviLetovi=data?.flights || []

        if(this.sviLetovi.length==0){
          this.messageKey="FLIGHT_SEARCH.NO_RESULTS"
        }

        this.isLoading=false
      }

      else{
        this.messageKey="API_ERRORS.AERODATABOX_ACCESS"
        this.isLoading=false
      }
    })
    
  }


  getFlightStatusKey(status:string | null | undefined):string{

    if(!status){
      return "COMMON.UNKNOWN_STATUS"
    }

    const normalized=String(status).trim().toLowerCase().replace(/[\s_-]/g,"")

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

    return statuses[normalized] || "COMMON.UNKNOWN_STATUS"
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

    this.sviLetovi=[]
    this.messageKey=""
    this.isLoading=false
  }


  ngOnDestroy(){

    if(this.departureSearchTimer){
      clearTimeout(this.departureSearchTimer)
    }

    if(this.arrivalSearchTimer){
      clearTimeout(this.arrivalSearchTimer)
    }
  }
}