import {Component,inject,OnDestroy,OnInit} from '@angular/core'
import {Router} from '@angular/router'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {createWorker,PSM} from 'tesseract.js'
import {UserService} from '../services/user-service'
import {TravelDocument} from '../models/TravelDocument'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import { TravelDocumentService } from '../services/travel-document-service'

@Component({
  selector: 'app-register',
  imports:[CommonModule,FormsModule,TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit,OnDestroy {

  passportImage = ""
  passportFileName = ""
  passportPreview = ""
  messageKey=""

  userService = inject(UserService)
  router=inject(Router)
  translate=inject(TranslateService)
  documentService=inject(TravelDocumentService)

  currentLanguage="sr"

  passportRead = false
  isReadingPassport = false

  firstName = ""
  lastName = ""

  email = ""
  username = ""
  password = ""

  documentType = ""
  documentNumber = ""
  nationality = ""

  dateOfBirth = new Date()
  sex = ""
  expirationDate = new Date()

  nameRegex = /^[a-zA-ZšđčćžŠĐČĆŽ\s-]+$/
  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  usernameRegex = /^[a-zA-Z0-9_.]+$/

  passport = new TravelDocument()

  ngOnInit(){
    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.currentLanguage=savedLanguage
    }else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
  }


  async continueRegistration(){

    if(this.passportImage==""){
      this.messageKey="OCR.SELECT_IMAGE"
      return
    }

    this.messageKey="OCR.READING"
    this.isReadingPassport=true

    let worker:any=null

    try{
      const mrzImage=await this.prepareMrzImage(this.passportImage)

      worker=await createWorker("eng")

      await worker.setParameters({
        tessedit_pageseg_mode:PSM.SINGLE_BLOCK,
        tessedit_char_whitelist:"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"
      })

      const result=await worker.recognize(mrzImage)
      
      const lines=this.prepareOcrLines(result.data.text)

      let parsedDocument:any=null

      if(lines.length>=2 && lines[0].startsWith("P")){
        parsedDocument=this.parseTd3(lines.slice(0,2))
      }else if(lines.length>=3){
        parsedDocument=this.parseTd1(lines.slice(0,3))
      }

      if(parsedDocument==null){
        this.messageKey="OCR.CANNOT_READ_MRZ"
        return
      }

      this.documentType=parsedDocument.documentType
      this.documentNumber=parsedDocument.documentNumber
      this.nationality=parsedDocument.nationality
      this.dateOfBirth=parsedDocument.dateOfBirth
      this.sex=parsedDocument.sex
      this.expirationDate=parsedDocument.expirationDate

      this.passportRead=true
      this.messageKey=""

    }catch(error){
      this.messageKey="OCR.READ_ERROR"
    }finally{
      this.isReadingPassport=false

      if(worker){
        await worker.terminate()
      }
    }
  }

  prepareMrzImage(imageSource:string):Promise<string>{

    return new Promise((resolve,reject)=>{

      const image=new Image()

      image.onload=()=>{

        const sourceY=Math.floor(image.height*0.55)
        const sourceHeight=image.height-sourceY
        const scale=Math.max(2,1600/image.width)

        const canvas=document.createElement("canvas")
        canvas.width=Math.floor(image.width*scale)
        canvas.height=Math.floor(sourceHeight*scale)

        const context=canvas.getContext("2d")

        if(!context){
          reject(new Error("Canvas nije dostupan"))
          return
        }

        context.drawImage(image,0,sourceY,image.width,sourceHeight,0,0,canvas.width,canvas.height)

        resolve(canvas.toDataURL("image/png"))
      }

      image.onerror=()=>{
        reject(new Error("Slika nije učitana"))
      }

      image.src=imageSource
    })
  }

  prepareOcrLines(text:string):string[]{

    return text
      .toUpperCase()
      .split(/\r?\n/)
      .map(line=>line.replace(/\s+/g,"").replace(/[^A-Z0-9<]/g,""))
      .filter(line=>line.length>=25)
  }


  changeLanguage(language:string){
    if(language!="sr" && language!="en" && language!="es"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
  }

  getDocumentTypeKey():string{
    if(this.documentType=="passport"){
      return "COMMON.PASSPORT"
    }

    if(this.documentType=="identityCard"){
      return "COMMON.IDENTITY_CARD"
    }

    return "COMMON.NOT_AVAILABLE"
  }

  onPassportSelected(event: any) {

    this.messageKey= ""
    this.passportRead = false
    this.documentType = ""
    this.documentNumber = ""
    this.nationality = ""
    this.dateOfBirth = new Date()
    this.sex = ""
    this.expirationDate = new Date()

    const file: File = event.target.files[0]
    if (!file) {
      return
    }
    if (file.type != "image/jpeg" && file.type != "image/png") {
      this.messageKey= "OCR.ALLOWED_FORMATS"
      event.target.value = ""
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      this.messageKey= "OCR.MAX_SIZE"
      event.target.value = ""
      return
    }

    this.releasePassportImage()
    const objectUrl = URL.createObjectURL(file)
    this.passportImage = objectUrl
    this.passportPreview = objectUrl
    this.passportFileName = file.name
  }


  parseTd3(lines: string[]): any {

    if (lines.length != 2) {
      return null
    }

    const secondLine = lines[1]
    const documentNumber = secondLine.substring(0, 9).replace(/</g, "").trim()
    const nationality = this.normalizeNationality(secondLine.substring(10, 13))
    const birthDate = this.correctNumbers(secondLine.substring(13, 19))
    const readSex = this.correctLetters(secondLine.substring(20, 21))
    const expirationDate = this.correctNumbers(secondLine.substring(21, 27))

    if (documentNumber == "" || nationality == "" || !this.isValidMrzDate(birthDate) || !this.isValidMrzDate(expirationDate)) {
      return null
    }

    return {
      documentType: "passport",
      documentNumber: documentNumber,
      nationality: nationality,
      dateOfBirth: this.convertMrzDate(
        birthDate,
        true
      ),
      sex: this.normalizeSex(readSex),
      expirationDate: this.convertMrzDate(
        expirationDate,
        false
      )
    }
  }


  parseTd1(lines: string[]): any {

    if (lines.length != 3) {
      return null
    }

    const firstLine = lines[0]
    const secondLine = lines[1]
    const rawDocumentNumber = firstLine.substring(5, 14)
    const documentNumber = rawDocumentNumber.replace(/</g, "").trim()
    const birthDate = this.correctNumbers(secondLine.substring(0, 6))
    const readSex = this.correctLetters(secondLine.substring(7, 8))
    const expirationDate = this.correctNumbers(secondLine.substring(8, 14))
    let nationality = this.normalizeNationality(secondLine.substring(15, 18))
    if (nationality == "") {
      nationality = this.normalizeNationality(firstLine.substring(2, 5))
    }

    if (documentNumber == "" || !this.isValidMrzDate(birthDate) || !this.isValidMrzDate(expirationDate)) {
      return null
    }

    return {
      documentType: "identityCard",
      documentNumber: documentNumber,
      nationality: nationality,
      dateOfBirth: this.convertMrzDate(
        birthDate,
        true
      ),
      sex: this.normalizeSex(readSex),
      expirationDate: this.convertMrzDate(
        expirationDate,
        false
      )
    }
  }


  normalizeNationality(value: string): string {

    const nationality = this.correctLetters(value).replace(/</g, "").trim()
    if (nationality == "D") {
      return "DEU"
    }
    return nationality
  }


  normalizeSex(value: string): string {
    if (value == "M") {
      return "M"
    }
    if (value == "F") {
      return "F"
    }
    if (value == "X") {
      return "X"
    }
    return ""
  }


  correctLetters(value: string): string {
    return value.toUpperCase().replace(/0/g, "O").replace(/1/g, "I").replace(/2/g, "Z").replace(/5/g, "S").replace(/6/g, "G").replace(/8/g, "B")
  }

  correctNumbers(value: string): string {
    return value.toUpperCase().replace(/[OQD]/g, "0").replace(/[IL]/g, "1").replace(/Z/g, "2").replace(/S/g, "5").replace(/G/g, "6").replace(/B/g, "8")
  }


  isValidMrzDate(value: string): boolean {

    if (!/^\d{6}$/.test(value)) {
      return false
    }
    const year = Number(value.substring(0, 2))
    const month = Number(value.substring(2, 4))
    const day = Number(value.substring(4, 6))
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false
    }
    const testDate = new Date(Date.UTC(2000 + year, month - 1, day))
    return (testDate.getUTCMonth() == month - 1 && testDate.getUTCDate() == day)
  }


  convertMrzDate(value: string, birthDate: boolean): Date {

    const shortYear = Number(value.substring(0, 2))
    const month = Number(value.substring(2, 4))
    const day = Number(value.substring(4, 6))
    const currentYear = new Date().getFullYear()
    const currentShortYear = currentYear % 100
    let fullYear = 2000 + shortYear
    if (birthDate && shortYear > currentShortYear) {
      fullYear = 1900 + shortYear
    }
    return new Date(Date.UTC(fullYear, month - 1, day))
  }


  validatePassword(password: string): boolean {

    if (password.length < 8 || password.length > 12) {
      return false
    }
    if (!/^[a-zA-Z]/.test(password)) {
      return false
    }
    if (!/[A-Z]/.test(password)) {
      return false
    }
    if (!/\d/.test(password)) {
      return false
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false
    }
    return true
  }


  register() {

    this.messageKey= ""
    if (!this.passportImage || !this.passportRead) {
      this.messageKey= "REGISTER.ERROR_DOCUMENT_REQUIRED"
      return
    }
    if (this.firstName.trim() == "" || this.lastName.trim() == "" || this.email.trim() == "" || this.username.trim() == "" || this.password == "") {
      this.messageKey= "REGISTER.ERROR_REQUIRED_FIELDS"
      return
    }
    if (!this.nameRegex.test(this.firstName) || !this.nameRegex.test(this.lastName)) {
      this.messageKey= "REGISTER.ERROR_NAME"
      return
    }
    if (!this.emailRegex.test(this.email)) {
      this.messageKey= "REGISTER.ERROR_EMAIL"
      return
    }
    if (!this.usernameRegex.test(this.username)) {
      this.messageKey= "REGISTER.ERROR_USERNAME"
      return
    }
    if (!this.validatePassword(this.password)) {
      this.messageKey= "REGISTER.ERROR_PASSWORD"
      return
    }

    this.passport.firstName = this.firstName.trim()
    this.passport.lastName = this.lastName.trim()
    this.passport.documentType = this.documentType
    this.passport.documentNumber = this.documentNumber
    this.passport.nationality = this.nationality
    this.passport.dateOfBirth = this.dateOfBirth
    this.passport.sex = this.sex
    this.passport.expirationDate = this.expirationDate

    this.documentService.addTravelDocument(this.passport.firstName, this.passport.lastName, this.passport.documentType, this.passport.documentNumber, this.passport.nationality, this.passport.dateOfBirth, this.passport.sex, this.passport.expirationDate).subscribe(data=>{
      if(data){
        this.userService.register(this.firstName.trim(),this.lastName.trim(),this.email.trim(),this.username.trim(),this.password,this.passport).subscribe(data=>{
          if(data){

            if(data){
              this.releasePassportImage()
              this.router.navigate(["login"])
              return
            }

            this.messageKey="REGISTER.ERROR_GENERIC"
          }else{
            this.messageKey="REGISTER.ERROR_GENERIC"
          }
        })
      }else{
        this.messageKey="REGISTER.ERROR_GENERIC"
      }
    })


  }


  releasePassportImage() {

    if (this.passportImage.startsWith("blob:")) {
      URL.revokeObjectURL(this.passportImage)
    }

    this.passportImage = ""
    this.passportPreview = ""
    this.passportFileName = ""
  }


  ngOnDestroy() {
    this.releasePassportImage()
  }


  goToLogin() {
    this.router.navigate(["login"])
  }


  goToHome() {
    this.router.navigate([""])
  }
}