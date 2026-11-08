import {Component,inject,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {Router} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {User} from '../models/User'
import {UserService} from '../services/user-service'

@Component({
  selector:'app-profile',
  imports:[CommonModule,FormsModule,TranslatePipe],
  templateUrl:'./profile.html',
  styleUrl:'./profile.css',
})
export class Profile implements OnInit {

  user=new User()

  userService=inject(UserService)
  router=inject(Router)
  translate=inject(TranslateService)

  currentLanguage="sr"

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]

  spanishLanguageNationalities=[
    "ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM",
    "ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER",
    "URY","VEN"
  ]

  profileMenuOpen=false

  profileMessageKey=""
  passwordMessageKey=""

  isSavingProfile=false
  isSavingPassword=false

  oldPassword=""
  newPassword=""
  repeatNewPassword=""

  emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
  nameRegex=/^[a-zA-ZšđčćžŠĐČĆŽ\s-]+$/

  ngOnInit():void{

    const loggedUser=localStorage.getItem("loggedUser")

    if(!loggedUser){
      this.router.navigate(["/login"])
      return
    }

    this.user=JSON.parse(loggedUser)

    const lang=localStorage.getItem("language")
    if(lang){
      this.currentLanguage=lang
      this.translate.use(this.currentLanguage)
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

  validatePassword(password:string):boolean{

    if(password.length<8 || password.length>12){
      return false
    }

    if(!/^[a-zA-Z]/.test(password)){
      return false
    }

    if(!/[A-Z]/.test(password)){
      return false
    }

    if(!/\d/.test(password)){
      return false
    }

    if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)){
      return false
    }

    return true
  }

  changeUser(){

    this.profileMessageKey=""

    if(this.user.firstName.trim()==""){
      this.profileMessageKey="PROFILE.ERROR_FIRST_NAME_EMPTY"
      return
    }

    if(this.user.lastName.trim()==""){
      this.profileMessageKey="PROFILE.ERROR_LAST_NAME_EMPTY"
      return
    }

    if(!this.nameRegex.test(this.user.firstName.trim())){
      this.profileMessageKey="PROFILE.ERROR_FIRST_NAME_INVALID"
      return
    }

    if(!this.nameRegex.test(this.user.lastName.trim())){
      this.profileMessageKey="PROFILE.ERROR_LAST_NAME_INVALID"
      return
    }

    if(this.user.email.trim()==""){
      this.profileMessageKey="PROFILE.ERROR_EMAIL_EMPTY"
      return
    }

    if(!this.emailRegex.test(this.user.email.trim())){
      this.profileMessageKey="PROFILE.ERROR_EMAIL_INVALID"
      return
    }

    this.isSavingProfile=true

    this.userService.change(
      this.user.firstName.trim(),
      this.user.lastName.trim(),
      this.user.email.trim(),
      this.user.password,
      this.user.username
    ).subscribe({
      next:data=>{

        this.isSavingProfile=false

        if(!data){
          this.profileMessageKey="PROFILE.ERROR_UPDATE"
          return
        }

        this.user=data

        localStorage.setItem(
          "loggedUser",
          JSON.stringify(data)
        )

        this.profileMessageKey="PROFILE.UPDATE_SUCCESS"
      },

      error:error=>{


        this.isSavingProfile=false
        this.profileMessageKey="PROFILE.ERROR_UPDATE"
      }
    })
  }

  changePassword(){

    this.passwordMessageKey=""

    if(this.oldPassword==""){
      this.passwordMessageKey="PROFILE.ERROR_OLD_PASSWORD_EMPTY"
      return
    }

    if(this.newPassword==""){
      this.passwordMessageKey="PROFILE.ERROR_NEW_PASSWORD_EMPTY"
      return
    }

    if(this.repeatNewPassword==""){
      this.passwordMessageKey="PROFILE.ERROR_REPEAT_PASSWORD_EMPTY"
      return
    }

    if(this.newPassword!=this.repeatNewPassword){
      this.passwordMessageKey="PROFILE.ERROR_PASSWORD_MISMATCH"
      return
    }

    if(!this.validatePassword(this.newPassword)){
      this.passwordMessageKey="PROFILE.ERROR_NEW_PASSWORD_INVALID"
      return
    }

    if(this.oldPassword==this.newPassword){
      this.passwordMessageKey="PROFILE.ERROR_PASSWORD_SAME"
      return
    }

    this.isSavingPassword=true

    this.userService.changePassword(
      this.oldPassword,
      this.newPassword,
      this.user.username
    ).subscribe({
      next:data=>{

        this.isSavingPassword=false

        if(!data){
          this.passwordMessageKey="PROFILE.ERROR_PASSWORD_UPDATE"
          return
        }

        this.user=data

        localStorage.setItem(
          "loggedUser",
          JSON.stringify(data)
        )

        this.oldPassword=""
        this.newPassword=""
        this.repeatNewPassword=""

        this.passwordMessageKey="PROFILE.PASSWORD_SUCCESS"
      },

      error:error=>{


        this.isSavingPassword=false
        this.passwordMessageKey="PROFILE.ERROR_PASSWORD_UPDATE"
      }
    })
  }

  toggleProfileMenu(){
    this.profileMenuOpen=!this.profileMenuOpen
  }

  closeProfileMenu(){
    this.profileMenuOpen=false
  }

  logout(){

    localStorage.removeItem("loggedUser")
    this.router.navigate(["/login"])
  }
}