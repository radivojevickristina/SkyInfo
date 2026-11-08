import { Component, inject, OnInit } from '@angular/core';
import { CurrencyService } from '../services/currency-service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TranslatePipe,TranslateService} from '@ngx-translate/core'

@Component({
  selector: 'app-currency-component',
  imports: [DecimalPipe, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './currency-component.html',
  styleUrl: './currency-component.css',
})
export class CurrencyComponent implements OnInit {

  currencyService=inject(CurrencyService)
  translate=inject(TranslateService)
  
  amount=0
  fromCurrency="EUR"
  toCurrency="RSD"
  currentLanguage="sr"

  convertedAmount:number|null=null
  exchangeRate:number|null=null

  isLoading=false
  messageKey=""

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]
  spanishLanguageNationalities=["ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM","ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER","URY","VEN"]

  currencies=[
    "EUR",
    "RSD",
    "USD",
    "GBP",
    "CHF",
    "CAD",
    "AUD",
    "JPY",
    "CNY",
    "TRY"
  ]

  isLoggedIn=false
  homeRoute="/"
  flightsRoute="/guest/main"
  mapRoute="/guest/map"
  visaRoute="/guest/visa"
  accountRoute="/login"

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


  convertCurrency(){

    if(this.amount<=0){
      this.convertedAmount=0
      return
    }

    this.currencyService.convertCurrency(this.fromCurrency,this.toCurrency,this.amount).subscribe(data=>{
      if(data && data.success){
        this.convertedAmount=data.result
      }
    })
  }

  swapCurrencies(){
    const oldFrom=this.fromCurrency
    this.fromCurrency=this.toCurrency
    this.toCurrency=oldFrom
    this.convertedAmount=null
    this.exchangeRate=null
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
