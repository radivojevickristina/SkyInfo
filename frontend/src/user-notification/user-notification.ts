import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TravelDocument } from '../models/TravelDocument';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { NotificationService } from '../services/notification-service';
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-notification',
  imports: [TranslatePipe,DatePipe],
  templateUrl: './user-notification.html',
  styleUrl: './user-notification.css',
})
export class UserNotification implements OnInit {

  router=inject(Router)
  translate=inject(TranslateService)
  service=inject(NotificationService)

  user=new User()
  primaryDocument=new TravelDocument()

  currentLanguage="sr"

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]
  spanishLanguageNationalities=["ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM","ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER","URY","VEN"]

  profileMenuOpen=false

  notifications:Notification[]=[]

  ngOnInit():void{

    const loggedUser=localStorage.getItem("loggedUser")

    if(!loggedUser){
      this.router.navigate(["/login"])
      return
    }

    this.user=JSON.parse(loggedUser)
    this.primaryDocument=this.user.primaryTravelDocument

    this.service.getNotificationsByUserId(this.user._id).subscribe(data=>{
      if(data){
        this.notifications=data
      }
    })


    const lang=localStorage.getItem("language")
    if(lang){
      this.currentLanguage=lang
      this.translate.use(this.currentLanguage)
    }
  }

  markAsRead(notification:Notification){

    if(notification.read){
      return
    }

    this.service.markAsRead(notification._id,this.user._id).subscribe({

      next:updatedNotification=>{

        const index=this.notifications.findIndex(item=>item._id==updatedNotification._id)
        if(index!=-1){
          this.notifications[index]=updatedNotification
        }
      },

      
    })
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

  odjaviSe(){

    localStorage.removeItem("loggedUser")
    this.router.navigate(["login"])
  }

}
