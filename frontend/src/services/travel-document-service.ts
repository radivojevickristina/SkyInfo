import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TravelDocument } from '../models/TravelDocument';

@Injectable({
  providedIn: 'root',
})
export class TravelDocumentService {
  private http=inject(HttpClient)
  private backendUrl="http://localhost:4000"

  addTravelDocument(firstName:string, lastName:string , documentType:string, documentNumber:string, nationality:string, dateOfBirth:Date, sex:string, expirationDate:Date){
    const data={
      firstName:firstName,
      lastName:lastName,
      documentType:documentType,
      documentNumber:documentNumber,
      nationality:nationality,
      dateOfBirth:dateOfBirth,
      sex:sex,
      expirationDate:expirationDate
    }

    return this.http.post<number>(`${this.backendUrl}/travelDocument/addDocument`, data)
  } 

  getDocumentById(id:string){
    return this.http.post<TravelDocument>(`${this.backendUrl}/travelDocument/getTravelDocument`, {id:id})
  }
}
