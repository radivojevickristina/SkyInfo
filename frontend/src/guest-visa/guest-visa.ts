import {Component,inject,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {RouterLink} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'

import {TravelRequirements} from '../models/TravelRequirements'
import {TravelBuddyService} from '../services/travel-buddy-service'

import * as countries from 'i18n-iso-countries'
import srLocale from 'i18n-iso-countries/langs/sr.json'
import enLocale from 'i18n-iso-countries/langs/en.json'
import esLocale from 'i18n-iso-countries/langs/es.json'

import { Country } from '../models/Country'



function convertToLatin(value:string):string{

  const letters:Record<string,string>={
    "А":"A",
    "Б":"B",
    "В":"V",
    "Г":"G",
    "Д":"D",
    "Ђ":"Đ",
    "Е":"E",
    "Ж":"Ž",
    "З":"Z",
    "И":"I",
    "Ј":"J",
    "К":"K",
    "Л":"L",
    "Љ":"Lj",
    "М":"M",
    "Н":"N",
    "Њ":"Nj",
    "О":"O",
    "П":"P",
    "Р":"R",
    "С":"S",
    "Т":"T",
    "Ћ":"Ć",
    "У":"U",
    "Ф":"F",
    "Х":"H",
    "Ц":"C",
    "Ч":"Č",
    "Џ":"Dž",
    "Ш":"Š",

    "а":"a",
    "б":"b",
    "в":"v",
    "г":"g",
    "д":"d",
    "ђ":"đ",
    "е":"e",
    "ж":"ž",
    "з":"z",
    "и":"i",
    "ј":"j",
    "к":"k",
    "л":"l",
    "љ":"lj",
    "м":"m",
    "н":"n",
    "њ":"nj",
    "о":"o",
    "п":"p",
    "р":"r",
    "с":"s",
    "т":"t",
    "ћ":"ć",
    "у":"u",
    "ф":"f",
    "х":"h",
    "ц":"c",
    "ч":"č",
    "џ":"dž",
    "ш":"š"
  }

  return value.split("").map(letter=>letters[letter] || letter).join("")
}

countries.registerLocale(srLocale)
countries.registerLocale(enLocale)
countries.registerLocale(esLocale)

@Component({
  selector:'app-guest-visa',
  imports:[CommonModule,FormsModule,RouterLink,TranslatePipe],
  templateUrl:'./guest-visa.html',
  styleUrl:'./guest-visa.css'
})
export class GuestVisa implements OnInit {

  translate=inject(TranslateService)
  travelBuddyService=inject(TravelBuddyService)

  currentLanguage="sr"

  today=new Date().toISOString().split("T")[0]

  travelRequirements:TravelRequirements | null=null
  travelRequirementsMessageKey=""

  isLoading=false

  passportCountryText=""
  originCountryText=""
  destinationCountryText=""

  selectedPassportCountry:Country | null=null
  selectedOriginCountry:Country | null=null
  selectedDestinationCountry:Country | null=null

  passportCountrySuggestions:Country[]=[]
  originCountrySuggestions:Country[]=[]
  destinationCountrySuggestions:Country[]=[]

  passportExpirationDate=""
  travelDate=""

  selectedOriginName=""
  selectedDestinationName=""

  countryOptions:Country[]=[]


  ngOnInit(){

    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.currentLanguage=savedLanguage
    }
    else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
    this.buildCountryOptions()
  }


  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es"){
      return
    }

    this.currentLanguage=language

    localStorage.setItem("language",language)

    this.translate.use(language)

    this.buildCountryOptions()
    this.refreshSelectedCountries()
  }


  buildCountryOptions(){

    const locale=this.currentLanguage=="sr" ? "sr" : this.currentLanguage

    this.countryOptions=Object.entries(
      countries.getNames(locale,{
        select:"official"
      })
    ).map(([code,name])=>{

      return {
        code:code.toUpperCase(),
        name:this.currentLanguage=="sr"
          ? convertToLatin(String(name))
          : String(name)
      }

    }).sort((first,second)=>first.name.localeCompare(second.name))
  }


  refreshSelectedCountries(){

    if(this.selectedPassportCountry){

      const passport=this.countryOptions.find(country=>country.code==this.selectedPassportCountry?.code)

      if(passport){
        this.selectedPassportCountry=passport
        this.passportCountryText=`${passport.name} (${passport.code})`
      }
    }

    if(this.selectedOriginCountry){

      const origin=this.countryOptions.find(country=>country.code==this.selectedOriginCountry?.code)

      if(origin){
        this.selectedOriginCountry=origin
        this.originCountryText=`${origin.name} (${origin.code})`
        this.selectedOriginName=origin.name
      }
    }

    if(this.selectedDestinationCountry){

      const destination=this.countryOptions.find(country=>country.code==this.selectedDestinationCountry?.code)

      if(destination){
        this.selectedDestinationCountry=destination
        this.destinationCountryText=`${destination.name} (${destination.code})`
        this.selectedDestinationName=destination.name
      }
    }
  }


  normalizeText(value:string):string{

    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .trim()
      .toLowerCase()
  }


  filterCountries(value:string):Country[]{

    const query=this.normalizeText(value)

    if(query.length<1){
      return []
    }

    return this.countryOptions.map(country=>{

      const normalizedName=this.normalizeText(country.name)
      const normalizedCode=this.normalizeText(country.code)

      let priority=3

      if(normalizedCode==query || normalizedName==query){
        priority=0
      }
      else if(normalizedName.startsWith(query) || normalizedCode.startsWith(query)){
        priority=1
      }
      else if(normalizedName.includes(query)){
        priority=2
      }

      return {
        country:country,
        priority:priority
      }

    })
    .filter(result=>result.priority<3)
    .sort((first,second)=>{

      if(first.priority!=second.priority){
        return first.priority-second.priority
      }

      return first.country.name.localeCompare(second.country.name)

    })
    .slice(0,10)
    .map(result=>result.country)
  }


  findCountry(value:string):Country | null{

    const normalizedValue=this.normalizeText(value)

    if(!normalizedValue){
      return null
    }

    const country=this.countryOptions.find(item=>{

      const normalizedName=this.normalizeText(item.name)
      const normalizedCode=this.normalizeText(item.code)
      const fullValue=this.normalizeText(`${item.name} (${item.code})`)

      return normalizedName==normalizedValue || normalizedCode==normalizedValue || fullValue==normalizedValue

    })

    return country || null
  }


  onPassportCountryInput(){

    this.selectedPassportCountry=null
    this.passportCountrySuggestions=this.filterCountries(this.passportCountryText)
  }


  showPassportCountrySuggestions(){

    if(this.passportCountryText.trim()==""){
      this.passportCountrySuggestions=this.countryOptions.slice(0,10)
      return
    }

    this.passportCountrySuggestions=this.filterCountries(this.passportCountryText)
  }


  selectPassportCountry(country:Country){

    this.selectedPassportCountry=country
    this.passportCountryText=`${country.name} (${country.code})`
    this.passportCountrySuggestions=[]
  }


  closePassportCountrySuggestions(){

    setTimeout(()=>{
      this.passportCountrySuggestions=[]
    },150)
  }


  onOriginCountryInput(){

    this.selectedOriginCountry=null
    this.originCountrySuggestions=this.filterCountries(this.originCountryText)
  }


  showOriginCountrySuggestions(){

    if(this.originCountryText.trim()==""){
      this.originCountrySuggestions=this.countryOptions.slice(0,10)
      return
    }

    this.originCountrySuggestions=this.filterCountries(this.originCountryText)
  }


  selectOriginCountry(country:Country){

    this.selectedOriginCountry=country
    this.originCountryText=`${country.name} (${country.code})`
    this.originCountrySuggestions=[]
  }


  closeOriginCountrySuggestions(){

    setTimeout(()=>{
      this.originCountrySuggestions=[]
    },150)
  }


  onDestinationCountryInput(){

    this.selectedDestinationCountry=null
    this.destinationCountrySuggestions=this.filterCountries(this.destinationCountryText)
  }


  showDestinationCountrySuggestions(){

    if(this.destinationCountryText.trim()==""){
      this.destinationCountrySuggestions=this.countryOptions.slice(0,10)
      return
    }

    this.destinationCountrySuggestions=this.filterCountries(this.destinationCountryText)
  }


  selectDestinationCountry(country:Country){

    this.selectedDestinationCountry=country
    this.destinationCountryText=`${country.name} (${country.code})`
    this.destinationCountrySuggestions=[]
  }


  closeDestinationCountrySuggestions(){

    setTimeout(()=>{
      this.destinationCountrySuggestions=[]
    },150)
  }


  checkTravelRequirements(){

    this.travelRequirements=null
    this.travelRequirementsMessageKey=""

    this.selectedOriginName=""
    this.selectedDestinationName=""

    this.isLoading=false

    const passportCountry=this.selectedPassportCountry || this.findCountry(this.passportCountryText)
    const originCountry=this.selectedOriginCountry || this.findCountry(this.originCountryText)
    const destinationCountry=this.selectedDestinationCountry || this.findCountry(this.destinationCountryText)

    if(!passportCountry){
      this.travelRequirementsMessageKey="VISA.ERROR_SELECT_PASSPORT"
      return
    }

    if(!originCountry){
      this.travelRequirementsMessageKey="VISA.ERROR_SELECT_ORIGIN"
      return
    }

    if(!destinationCountry){
      this.travelRequirementsMessageKey="VISA.ERROR_SELECT_DESTINATION"
      return
    }

    if(originCountry.code==destinationCountry.code){
      this.travelRequirementsMessageKey="VISA.ERROR_SAME_ORIGIN_DESTINATION"
      return
    }

    if(passportCountry.code==destinationCountry.code){
      this.travelRequirementsMessageKey="VISA.ERROR_SAME_PASSPORT_DESTINATION"
      return
    }

    if(!this.passportExpirationDate){
      this.travelRequirementsMessageKey="VISA.ERROR_ENTER_PASSPORT_EXPIRATION"
      return
    }

    if(!this.travelDate){
      this.travelRequirementsMessageKey="VISA.ERROR_ENTER_TRAVEL_DATE"
      return
    }

    const expirationDate=new Date(`${this.passportExpirationDate}T00:00:00`)
    const selectedTravelDate=new Date(`${this.travelDate}T00:00:00`)

    if(Number.isNaN(expirationDate.getTime()) || Number.isNaN(selectedTravelDate.getTime())){
      this.travelRequirementsMessageKey="VISA.ERROR_INVALID_DATES"
      return
    }

    if(expirationDate<selectedTravelDate){
      this.travelRequirementsMessageKey="VISA.ERROR_PASSPORT_EXPIRES_BEFORE_TRAVEL"
      return
    }

    this.selectedPassportCountry=passportCountry
    this.selectedOriginCountry=originCountry
    this.selectedDestinationCountry=destinationCountry

    this.selectedOriginName=originCountry.name
    this.selectedDestinationName=destinationCountry.name

    this.isLoading=true

    this.travelBuddyService.checkRequirements(
      passportCountry.code,
      destinationCountry.code,
      this.passportExpirationDate,
      this.travelDate
    ).subscribe({
      next:data=>{

        this.travelRequirements=data
        this.isLoading=false
      },

      error:error=>{


        this.travelRequirementsMessageKey="VISA.ERROR_CHECK_FAILED"

        this.isLoading=false
      }
    })
  }


  getRequiredValidityDays():number | null{

    if(!this.travelRequirements){
      return null
    }

    const validityText=this.travelRequirements.data.destination.passport_validity

    if(!validityText){
      return null
    }

    const normalizedText=validityText.toLowerCase().trim()

    let requiredDays=0
    let foundRequirement=false

    const yearMatch=normalizedText.match(/(\d+)\s*(year|years|yr|yrs)/)

    if(yearMatch){

      requiredDays+=Number(yearMatch[1])*365
      foundRequirement=true
    }

    const monthMatch=normalizedText.match(/(\d+)\s*(month|months|mo)/)

    if(monthMatch){

      requiredDays+=Number(monthMatch[1])*30
      foundRequirement=true
    }

    const dayMatch=normalizedText.match(/(\d+)\s*(day|days)/)

    if(dayMatch){

      requiredDays+=Number(dayMatch[1])
      foundRequirement=true
    }

    if(normalizedText.includes("valid on arrival") || normalizedText.includes("valid at arrival")){
      return 0
    }

    if(!foundRequirement){
      return null
    }

    return requiredDays
  }


  isDocumentValidityEnough():boolean{

    if(!this.travelRequirements || !this.travelRequirements.documentCheck){
      return false
    }

    const documentCheck=this.travelRequirements.documentCheck

    if(!documentCheck.validOnTravelDate){
      return false
    }

    const requiredDays=this.getRequiredValidityDays()

    if(requiredDays===null){
      return false
    }

    return documentCheck.daysRemaining>=requiredDays
  }


  getDocumentValidityStatusKey():string{

    if(!this.travelRequirements || !this.travelRequirements.documentCheck){
      return "VISA.STATUS_CHECK_DOCUMENT"
    }

    const documentCheck=this.travelRequirements.documentCheck

    if(!documentCheck.validOnTravelDate){
      return "VISA.STATUS_DOCUMENT_INVALID"
    }

    const requiredDays=this.getRequiredValidityDays()

    if(requiredDays===null){
      return "VISA.STATUS_CHECK_VALIDITY"
    }

    if(documentCheck.daysRemaining>=requiredDays){
      return "VISA.STATUS_DOCUMENT_VALID"
    }

    return "VISA.STATUS_INSUFFICIENT_VALIDITY"
  }


  getVisaRuleText(value:string):string{

    const normalized=String(value || "").trim().toLowerCase()

    if(normalized=="visa required"){
      return this.translate.instant("VISA.STATUS_VISA_REQUIRED")
    }

    if(normalized=="visa not required"){
      return this.translate.instant("VISA.STATUS_VISA_NOT_REQUIRED")
    }

    if(normalized=="visa on arrival"){
      return this.translate.instant("VISA.STATUS_VISA_ON_ARRIVAL")
    }

    if(normalized=="evisa" || normalized=="e-visa" || normalized=="electronic visa"){
      return this.translate.instant("VISA.STATUS_E_VISA")
    }

    return value
  }


  getPassportValidityText(value:string | undefined | null):string{

    if(!value){
      return this.translate.instant("COMMON.NO_DATA")
    }

    const normalized=String(value).trim().toLowerCase()

    if(normalized.includes("valid on arrival") || normalized.includes("valid at arrival")){
      return this.translate.instant("VISA.PASSPORT_VALID_ON_ARRIVAL")
    }

    const yearMatch=normalized.match(/(\d+)\s*(year|years|yr|yrs)/)

    if(yearMatch){
      return this.translate.instant("VISA.PASSPORT_VALID_YEARS",{
        count:Number(yearMatch[1])
      })
    }

    const monthMatch=normalized.match(/(\d+)\s*(month|months|mo)/)

    if(monthMatch){
      return this.translate.instant("VISA.PASSPORT_VALID_MONTHS",{
        count:Number(monthMatch[1])
      })
    }

    const dayMatch=normalized.match(/(\d+)\s*(day|days)/)

    if(dayMatch){
      return this.translate.instant("VISA.PASSPORT_VALID_DAYS",{
        count:Number(dayMatch[1])
      })
    }

    return value
  }
}