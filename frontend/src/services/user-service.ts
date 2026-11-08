import { inject, Injectable } from '@angular/core';
import { User } from '../models/User';
import { HttpClient } from '@angular/common/http';
import { TravelDocument } from '../models/TravelDocument';
import { Flights } from '../models/Flights';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http=inject(HttpClient)
  private backendUrl="http://localhost:4000"

  login(username:string, password:string){
    const data={
      firstName:"",
      lastName:"",
      email:"",
      username:username,
      password:password,
      primaryTravelDocument:0,
      secondaryTravelDocument:[],
      trackedFlights:[],
      admin:false
    }
    
    return this.http.post<User>(`${this.backendUrl}/user/login`, data)
  }
 
  register(firstName:string, lastName:string , email:string, username:string, password:string, primaryTravelDocument:TravelDocument){
    const data={
      firstName:firstName,
      lastName:lastName,
      email:email,
      username:username,
      password:password,
      primaryTravelDocument:primaryTravelDocument,
      secondaryTravelDocuments:[],
      trackedFlights:[],
      admin:false
    }
    return this.http.post<User | null>(`${this.backendUrl}/user/register`,data)
  } 
  
  addFlight(userId:string, trackedFlights:Array<Flights>){
    const data={
      userId:userId,
      trackedFlights:trackedFlights
    }
    return this.http.post<User>(`${this.backendUrl}/user/addFlight`, data)
  } 

  addSecondaryDocument(userId: string, document: TravelDocument){
    const data={
      userId:userId,
      document:document
    }
    return this.http.post<User>(`${this.backendUrl}/user/addSecondaryDocument`, data)
  } 

  deleteSecondaryDocument(userId: string, documentNumber: string){
    const data={
      userId:userId,
      documentNumber:documentNumber
    }
    return this.http.post<User>(`${this.backendUrl}/user/deleteSecondaryDocument`, data)
  } 

  change(firstName:string, lastName:string, email:string, password:string, username:string){
    const data={
      firstName:firstName,
      lastName:lastName,
      email:email,
      password:password,
      username:username
    }
    return this.http.post<User>(`${this.backendUrl}/user/change`, data)
  }

  changePassword(oldPassword:string,newPassword:string,username:string){
    const data={
      oldPassword:oldPassword,
      newPassword:newPassword,
      username:username
    }
    return this.http.post<User>(`${this.backendUrl}/user/changePassword`, data)
  }

  changePrimaryDocument(username:string,document:TravelDocument){
    return this.http.post<User>(`${this.backendUrl}/user/changePrimaryDocument`, {username:username,document:document})
  }

  getAllUsers(){
    return this.http.get<User[]>(`${this.backendUrl}/user/getAllUsers`)
  }

  updateTrackedFlights(userId:string,trackedFlights:any[]){
    return this.http.put<User>(`${this.backendUrl}/user/updateTrackedFlights`,{userId:userId,trackedFlights:trackedFlights})
  }

  deleteUser(id:string){
    return this.http.delete<User[]>(`${this.backendUrl}/user/deleteUser`, {body:{id:id}})
  }
}
