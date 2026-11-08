import {HttpClient} from '@angular/common/http'
import {inject,Injectable} from '@angular/core'
import {TravelRequirements} from '../models/TravelRequirements'

@Injectable({
    providedIn:'root'
})
export class TravelBuddyService {

    private http=inject(HttpClient)
    private backendUrl="http://localhost:4000"

    checkRequirements(passport:string,destination:string,expirationDate:Date | string,travelDate:string){

        const data={
          passport:passport,
          destination:destination,
          expirationDate:expirationDate,
          travelDate:travelDate
        }

        return this.http.post<TravelRequirements>(`${this.backendUrl}/travel/check`,data)
    }
}