import {HttpClient,HttpParams} from '@angular/common/http'
import {inject,Injectable} from '@angular/core'

@Injectable({
  providedIn:'root'
})
export class AeroDataBoxService {

  http=inject(HttpClient)
  backendUrl="http://localhost:4000"

  searchAirports(query:string){
    return this.http.get<any[]>(`${this.backendUrl}/aerodatabox/airports/search`,{params:{q:query.trim()}})

  }


  searchFlights(flightNumber:string,date:string,departureAirport:string,arrivalAirport:string){

    let parameters=new HttpParams()
    if(flightNumber.trim()!=""){
      parameters=parameters.set("flightNumber",flightNumber.trim())
    }

    if(date.trim()!=""){
      parameters=parameters.set("date",date.trim())
    }

    if(departureAirport.trim()!=""){
      parameters=parameters.set("departureAirport",departureAirport.trim().toUpperCase())
    }

    if(arrivalAirport.trim()!=""){
      parameters=parameters.set("arrivalAirport",arrivalAirport.trim().toUpperCase())
    }

    return this.http.get<any>(`${this.backendUrl}/aerodatabox/flights/search`,{params:parameters})
  }
}