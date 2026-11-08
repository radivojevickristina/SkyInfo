import {Component,inject,OnInit} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {Router, RouterLink} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {UserService} from '../services/user-service'
import { User } from '../models/User'
import { NotificationService } from '../services/notification-service'
import { AeroDataBoxService } from '../services/aero-data-box-service'

@Component({
  selector:'app-login',
  imports:[FormsModule,CommonModule,TranslatePipe, RouterLink],
  templateUrl:'./login.html',
  styleUrl:'./login.css',
})
export class Login implements OnInit {

  service=inject(UserService)
  router=inject(Router)
  translate=inject(TranslateService)

  currentLanguage="sr"

  isLoading=false
  username=""
  password=""
  messageKey=""
  showPassword=false

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]

  spanishLanguageNationalities=[
    "ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM",
    "ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER",
    "URY","VEN"
  ]

  notificationService=inject(NotificationService)
  flightService=inject(AeroDataBoxService)

  ngOnInit(){

    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.currentLanguage=savedLanguage
    }
    else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
  }


  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
  }


  togglePassword(){
    this.showPassword=!this.showPassword
  }

  login(){

    this.messageKey=""

    if(this.username=="" || this.password==""){
      this.messageKey="LOGIN.ERROR_REQUIRED"
      return
    }

    this.isLoading=true

    this.service.login(
      this.username,
      this.password
    ).subscribe({

      next:data=>{

        if(!data){
          this.isLoading=false
          this.messageKey="LOGIN.ERROR_WRONG_CREDENTIALS"
          return
        }

        localStorage.setItem("loggedUser",JSON.stringify(data))

        this.getAllNotificationForUser(data)

        this.currentLanguage=this.getLanguageByNationality(data.primaryTravelDocument.nationality)

        this.translate.use(this.currentLanguage)

        localStorage.setItem("language",this.currentLanguage)

        
      },

      error:error=>{


        this.isLoading=false
        this.messageKey="LOGIN.ERROR_GENERIC"
      }
    })
  }

  getAllNotificationForUser(user:User){

    const addNotification=(type:string,severity:string,titleKey:string,messageKey:string,params:Record<string,any>,uniqueKey:string,actionRoute:string)=>{

      this.notificationService.addNotification(
        user._id,
        type,
        severity,
        titleKey,
        messageKey,
        params,
        uniqueKey,
        false,
        null,
        actionRoute
      ).subscribe({
        next:()=>{},
        error:error=>{

        }
      })
    }



    const documents=[
      user.primaryTravelDocument,
      ...(user.secondaryTravelDocuments || [])
    ]

    const today=new Date()
    today.setHours(0,0,0,0)

    const threeMonthsFromNow=new Date(today)

    threeMonthsFromNow.setMonth(
      threeMonthsFromNow.getMonth()+3
    )

    documents.forEach(document=>{

      if(!document || !document.expirationDate){
        return
      }

      const expirationDate=new Date(document.expirationDate)

      expirationDate.setHours(0,0,0,0)

      const difference=expirationDate.getTime()-today.getTime()

      const daysUntilExpiration=Math.ceil(difference/(1000*60*60*24))



      if(expirationDate<today){

        addNotification(
          "document_expiration",
          "critical",
          "NOTIFICATIONS.DOCUMENT_EXPIRED_TITLE",
          "NOTIFICATIONS.DOCUMENT_EXPIRED_MESSAGE",
          {
            documentNumber:document.documentNumber,
            date:expirationDate.toLocaleDateString()
          },
          `document_expired_${document.documentNumber}_${expirationDate.getTime()}`,
          "/user/documents"
        )

        return
      }



      if(expirationDate<=threeMonthsFromNow){

        addNotification(
          "document_expiration",
          "warning",
          "NOTIFICATIONS.DOCUMENT_EXPIRING_TITLE",
          "NOTIFICATIONS.DOCUMENT_EXPIRING_MESSAGE",
          {
            documentNumber:document.documentNumber,
            days:daysUntilExpiration,
            date:expirationDate.toLocaleDateString()
          },
          `document_expiring_${document.documentNumber}_${expirationDate.getTime()}`,
          "/user/documents"
        )
      }
    })



    if(!user.trackedFlights || user.trackedFlights.length==0){

      this.isLoading=false

      this.router.navigate([
        "user/main"
      ])

      return
    }



    const refreshedFlights=[
      ...user.trackedFlights
    ]



    const checkFlight=(index:number)=>{



      if(index>=user.trackedFlights.length){

        this.service.updateTrackedFlights(
          user._id,
          refreshedFlights
        ).subscribe({

          next:updatedUser=>{

            if(updatedUser){

              localStorage.setItem(
                "loggedUser",
                JSON.stringify(updatedUser)
              )
            }

            this.isLoading=false

            this.router.navigate([
              "user/main"
            ])
          },

          error:error=>{


            this.isLoading=false

            this.router.navigate([
              "user/main"
            ])
          }
        })

        return
      }


      const savedFlight=user.trackedFlights[index]



      if(!savedFlight.flightNumber || (!savedFlight.departureScheduledTime && !savedFlight.departureScheduledTimeUtc)){

        checkFlight(index+1)
        return
      }



      const flightDateObject=new Date(savedFlight.departureScheduledTimeUtc || savedFlight.departureScheduledTime)

      const year=flightDateObject.getFullYear()

      const month=String(flightDateObject.getMonth()+1).padStart(2,"0")

      const day=String(flightDateObject.getDate()).padStart(2,"0")


      const flightDate=savedFlight.departureScheduledTime
        ? String(savedFlight.departureScheduledTime).substring(0,10)
        : String(savedFlight.departureScheduledTimeUtc).substring(0,10)



      this.flightService.searchFlights(
        savedFlight.flightNumber,
        flightDate,
        savedFlight.departureAirportIata || "",
        savedFlight.arrivalAirportIata || ""
      ).subscribe({

        next:data=>{

          if(data?.message){
            checkFlight(index+1)
            return
          }
          const flights=data?.flights || []


          if(flights.length==0){

            checkFlight(index+1)
            return
          }


          const matchingFlights=flights.filter((flight:any)=>
            flight.flightNumber==savedFlight.flightNumber &&
            flight.departureAirportIata==savedFlight.departureAirportIata &&
            flight.arrivalAirportIata==savedFlight.arrivalAirportIata
          )

          const savedDepartureTime=new Date(
            savedFlight.departureScheduledTimeUtc ||
            savedFlight.departureScheduledTime
          ).getTime()

          let currentFlight:any=null

          if(matchingFlights.length>0){

            currentFlight=matchingFlights.reduce((closest:any,flight:any)=>{

              const flightDepartureTime=new Date(
                flight.departureScheduledTimeUtc ||
                flight.departureScheduledTime
              ).getTime()

              if(!closest){
                return flight
              }

              const closestDepartureTime=new Date(
                closest.departureScheduledTimeUtc ||
                closest.departureScheduledTime
              ).getTime()

              const currentDifference=Math.abs(
                flightDepartureTime-savedDepartureTime
              )

              const closestDifference=Math.abs(
                closestDepartureTime-savedDepartureTime
              )

              return currentDifference<=closestDifference
                ? flight
                : closest
            },null)
          }

          console.log(currentFlight)

          if(!currentFlight){

            checkFlight(index+1)
            return
          }

          const currentStatus=String(currentFlight.status || "").toLowerCase()

          const savedStatus=String(savedFlight.status || "").toLowerCase()



          if((currentStatus.includes("cancelled") || currentStatus.includes("canceled")) && currentStatus!=savedStatus){

            addNotification(
              "flight_cancelled",
              "critical",
              "NOTIFICATIONS.FLIGHT_CANCELLED_TITLE",
              "NOTIFICATIONS.FLIGHT_CANCELLED_MESSAGE",
              {
                flight:savedFlight.flightNumber
              },
              `flight_cancelled_${savedFlight.externalKey}`,
              "/user/flights"
            )
          }



          if(currentFlight.status && currentFlight.status!=savedFlight.status && !currentStatus.includes("cancelled") && !currentStatus.includes("canceled")){

            addNotification(
              "flight_status",
              "info",
              "NOTIFICATIONS.FLIGHT_STATUS_TITLE",
              "NOTIFICATIONS.FLIGHT_STATUS_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                status:currentFlight.status
              },
              `flight_status_${savedFlight.externalKey}_${currentFlight.status}`,
              "/user/flights"
            )
          }



          if(currentFlight.departureGate && currentFlight.departureGate!=savedFlight.departureGate){

            addNotification(
              "gate_change",
              "info",
              "NOTIFICATIONS.DEPARTURE_GATE_TITLE",
              "NOTIFICATIONS.DEPARTURE_GATE_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                oldGate:savedFlight.departureGate || "-",
                gate:currentFlight.departureGate
              },
              `departure_gate_${savedFlight.externalKey}_${currentFlight.departureGate}`,
              "/user/flights"
            )
          }



          if(currentFlight.arrivalGate && currentFlight.arrivalGate!=savedFlight.arrivalGate){

            addNotification(
              "gate_change",
              "info",
              "NOTIFICATIONS.ARRIVAL_GATE_TITLE",
              "NOTIFICATIONS.ARRIVAL_GATE_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                oldGate:savedFlight.arrivalGate || "-",
                gate:currentFlight.arrivalGate
              },
              `arrival_gate_${savedFlight.externalKey}_${currentFlight.arrivalGate}`,
              "/user/flights"
            )
          }



          if(currentFlight.departureTerminal && currentFlight.departureTerminal!=savedFlight.departureTerminal){

            addNotification(
              "flight_status",
              "info",
              "NOTIFICATIONS.DEPARTURE_TERMINAL_TITLE",
              "NOTIFICATIONS.DEPARTURE_TERMINAL_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                terminal:currentFlight.departureTerminal
              },
              `departure_terminal_${savedFlight.externalKey}_${currentFlight.departureTerminal}`,
              "/user/flights"
            )
          }



          if(currentFlight.arrivalTerminal && currentFlight.arrivalTerminal!=savedFlight.arrivalTerminal){

            addNotification(
              "flight_status",
              "info",
              "NOTIFICATIONS.ARRIVAL_TERMINAL_TITLE",
              "NOTIFICATIONS.ARRIVAL_TERMINAL_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                terminal:currentFlight.arrivalTerminal
              },
              `arrival_terminal_${savedFlight.externalKey}_${currentFlight.arrivalTerminal}`,
              "/user/flights"
            )
          }



          if(currentFlight.departureScheduledTime && currentFlight.departureRevisedTime){

            const scheduledDeparture=new Date(currentFlight.departureScheduledTime)

            const revisedDeparture=new Date(currentFlight.departureRevisedTime)

            const delayMinutes=Math.round((revisedDeparture.getTime()-scheduledDeparture.getTime())/(1000*60))


            if(delayMinutes>=10){

              addNotification(
                "flight_delay",
                delayMinutes>=60 ? "warning" : "info",
                "NOTIFICATIONS.FLIGHT_DELAY_TITLE",
                "NOTIFICATIONS.FLIGHT_DELAY_MESSAGE",
                {
                  flight:savedFlight.flightNumber,
                  minutes:delayMinutes
                },
                `flight_delay_${savedFlight.externalKey}_${delayMinutes}`,
                "/user/flights"
              )
            }
          }



          if(currentFlight.departureCheckInDesk && currentFlight.departureCheckInDesk!=savedFlight.departureCheckInDesk){

            addNotification(
              "flight_status",
              "info",
              "NOTIFICATIONS.CHECK_IN_CHANGED_TITLE",
              "NOTIFICATIONS.CHECK_IN_CHANGED_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                desk:currentFlight.departureCheckInDesk
              },
              `checkin_${savedFlight.externalKey}_${currentFlight.departureCheckInDesk}`,
              "/user/flights"
            )
          }



          if(currentFlight.arrivalBaggageBelt && currentFlight.arrivalBaggageBelt!=savedFlight.arrivalBaggageBelt){

            addNotification(
              "flight_status",
              "info",
              "NOTIFICATIONS.BAGGAGE_BELT_TITLE",
              "NOTIFICATIONS.BAGGAGE_BELT_MESSAGE",
              {
                flight:savedFlight.flightNumber,
                belt:currentFlight.arrivalBaggageBelt
              },
              `baggage_${savedFlight.externalKey}_${currentFlight.arrivalBaggageBelt}`,
              "/user/flights"
            )
          }



          refreshedFlights[index]={
            ...savedFlight,
            ...currentFlight,
            externalKey:savedFlight.externalKey
          }



          checkFlight(index+1)
        },


        error:error=>{

          checkFlight(index+1)
        }
      })
    }



    checkFlight(0)
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


  goToRegister(){
    this.router.navigate(["register"])
  }


  goToHome(){
    this.router.navigate([""])
  }


  continueAsGuest(){
    this.router.navigate(["guest/main"])
  }
}
