import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {Notification} from "../models/Notification"

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http=inject(HttpClient)
  private backendUrl="http://localhost:4000"

  addNotification(userId:string | null,type:string,severity:string,titleKey:string,messageKey:string,params:Record<string,any>,uniqueKey:string,read:boolean,readAt:Date | null,actionRoute:string){
    const data={
      userId:userId,
      type:type,
      severity:severity,
      titleKey:titleKey,
      messageKey:messageKey,
      params:params,
      uniqueKey:uniqueKey,
      read:read,
      readAt:readAt,
      actionRoute:actionRoute
    }

    return this.http.post<Notification>(`${this.backendUrl}/notification/add`,data)
  }

  getNotificationsByUserId(userId:string){
      return this.http.get<Notification[]>(`${this.backendUrl}/notification/get/${userId}`)
  }

  markAsRead(notificationId:string,userId:string){
    return this.http.put<Notification>(`${this.backendUrl}/notification/read/${notificationId}`,{userId:userId})
  }
}
