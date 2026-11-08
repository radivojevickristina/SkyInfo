import {Component,inject,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {RouterLink} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'

@Component({
  selector:'app-about',
  imports:[CommonModule,RouterLink,TranslatePipe],
  templateUrl:'./about.html',
  styleUrl:'./about.css',
})
export class About implements OnInit {

  translate=inject(TranslateService)

  currentLanguage="sr"
  isLoggedIn=false

  homeRoute="/"
  flightsRoute="/guest/main"
  mapRoute="/guest/map"
  visaRoute="/guest/visa"
  accountRoute="/login"

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]

  spanishLanguageNationalities=[
    "ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM",
    "ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER",
    "URY","VEN"
  ]

  ngOnInit():void{

    const loggedUser=localStorage.getItem("loggedUser")
    const savedLanguage=localStorage.getItem("language")

    let nationality=""

    if(loggedUser){

      try{

        const user=JSON.parse(loggedUser)

        this.isLoggedIn=true

        this.homeRoute="/user/main"
        this.flightsRoute="/user/flights"
        this.mapRoute="/user/map"
        this.visaRoute="/user/visa"
        this.accountRoute="/user/main"

        nationality=user.primaryTravelDocument?.nationality || ""

      }
      catch(error){


        this.isLoggedIn=false
        localStorage.removeItem("loggedUser")
      }
    }

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.currentLanguage=savedLanguage
    }
    if(this.isLoggedIn){
      const lang=localStorage.getItem("language")
      if(lang){
        this.currentLanguage=lang
        this.translate.use(this.currentLanguage)
      }
    }
    else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
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
}