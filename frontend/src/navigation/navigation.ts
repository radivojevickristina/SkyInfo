import {Component,inject,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {filter} from 'rxjs'

import {User} from '../models/User'
import { NotificationService } from '../services/notification-service'

@Component({
  selector:'app-navigation',
  imports:[
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe
  ],
  templateUrl:'./navigation.html',
  styleUrl:'./navigation.css'
})
export class Navigation implements OnInit {

  router=inject(Router)
  translate=inject(TranslateService)
  notificationService=inject(NotificationService)

  user=new User()

  currentLanguage="sr"
  isLoggedIn=false
  profileMenuOpen=false
  homeRoute="/"
  flightsRoute="/guest/main"
  mapRoute="/guest/map"
  visaRoute="/guest/visa"

  numberUnread=0

  serbianLanguageNationalities=[
    "SRB","BIH","MNE","HRV"
  ]

  spanishLanguageNationalities=[
    "ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM",
    "ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER",
    "URY","VEN"
  ]


  ngOnInit():void{
    this.loadNavigationState()
    this.router.events.pipe(filter(event=>event instanceof NavigationEnd)).subscribe(()=>{
        this.loadNavigationState()
        this.profileMenuOpen=false
      })
  }


  loadNavigationState(){
    const loggedUser=localStorage.getItem("loggedUser")
    const savedLanguage=localStorage.getItem("language")
    let nationality=""
    if(loggedUser){

      try{
        const parsedUser=JSON.parse(loggedUser)
        this.user=parsedUser
        this.isLoggedIn=true
        this.homeRoute="/user/main"
        this.flightsRoute="/user/flights"
        this.mapRoute="/user/map"
        this.visaRoute="/user/visa"
        nationality=this.user.primaryTravelDocument?.nationality || ""

        this.notificationService.getNotificationsByUserId(this.user._id).subscribe(data=>{
          if(data){
            data.forEach(element => {
              if(!element.read){
                this.numberUnread++
              }
            });
          }
        })

      }
      catch(error){
        localStorage.removeItem("loggedUser")
        this.setGuestNavigation()
      }
    }
    else{
      this.setGuestNavigation()
    }


    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.currentLanguage=savedLanguage
    }
    else if(this.isLoggedIn){
      this.currentLanguage=this.getLanguageByNationality(nationality)
    }
    else{
      this.currentLanguage="sr"
    }
    this.translate.use(this.currentLanguage)
  }


  setGuestNavigation(){
    this.isLoggedIn=false
    this.user=new User()
    this.homeRoute="/"
    this.flightsRoute="/guest/main"
    this.mapRoute="/guest/map"
    this.visaRoute="/guest/visa"
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

  toggleProfileMenu(){
    this.profileMenuOpen=!this.profileMenuOpen
  }

  closeProfileMenu(){
    this.profileMenuOpen=false
  }

  logout(){
    localStorage.removeItem("loggedUser")
    this.profileMenuOpen=false
    this.setGuestNavigation()
    this.router.navigate(["/login"])
  }
}