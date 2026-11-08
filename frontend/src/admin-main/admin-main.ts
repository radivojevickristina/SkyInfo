import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/User';
import { UserService } from '../services/user-service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-main',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-main.html',
  styleUrl: './admin-main.css',
})
export class AdminMain implements OnInit{
  ruter=inject(Router)
  service=inject(UserService)
  notificationService=inject(NotificationService)

  user=new User()

  allUsers=new Array()

  notificationType=""
  notificationParam=""
  notificationMessage=""

  ngOnInit(): void {
    const loggedUser=localStorage.getItem("loggedUser")

    if(!loggedUser){
      this.ruter.navigate(["/login"])
      return
    }
    this.user=JSON.parse(loggedUser)

    this.service.getAllUsers().subscribe(data=>{
      if(data){
        this.allUsers=data
      }
    })


  }


  notificationTypes=[
    {
      value:"terminal_closure",
      titleKey:"NOTIFICATIONS.TERMINAL_CLOSURE_TITLE",
      messageKey:"NOTIFICATIONS.TERMINAL_CLOSURE_MESSAGE"
    },
    {
      value:"airport_entrance_closure",
      titleKey:"NOTIFICATIONS.ENTRANCE_CLOSURE_TITLE",
      messageKey:"NOTIFICATIONS.ENTRANCE_CLOSURE_MESSAGE"
    },
    {
      value:"airport_area_closure",
      titleKey:"NOTIFICATIONS.AREA_CLOSURE_TITLE",
      messageKey:"NOTIFICATIONS.AREA_CLOSURE_MESSAGE"
    },
    {
      value:"airport_maintenance",
      titleKey:"NOTIFICATIONS.MAINTENANCE_TITLE",
      messageKey:"NOTIFICATIONS.MAINTENANCE_MESSAGE"
    },
    {
      value:"airport_general",
      titleKey:"NOTIFICATIONS.AIRPORT_GENERAL_TITLE",
      messageKey:"NOTIFICATIONS.AIRPORT_GENERAL_MESSAGE"
    }
  ]

  createNotification(){

    const selectedType=this.notificationTypes.find(type=>{
      return type.value==this.notificationType
    })

    if(!selectedType){
      return
    }

    
    this.notificationService.addNotification(null,selectedType.value,"warning",selectedType.titleKey,selectedType.messageKey,{value:this.notificationParam},selectedType.value+"_"+Date.now(),false,null,"/user/main").subscribe()
    

    this.notificationMessage="Obaveštenje je poslato."
    this.notificationType=""
    this.notificationParam=""
  }

  delete(id:string){
    this.service.deleteUser(id).subscribe(data=>{
      if(data){
        this.service.getAllUsers().subscribe(data=>{
          if(data){
            this.allUsers=data
          }
        })
      }
    })
  }


  logout(){
    localStorage.removeItem("loggedUser")
    this.ruter.navigate(['admin/login'])
  }

}
