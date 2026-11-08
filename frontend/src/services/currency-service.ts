import {HttpClient,HttpHeaders} from '@angular/common/http'
import {inject,Injectable} from '@angular/core'

@Injectable({
  providedIn:'root'
})
export class CurrencyService {

  private http=inject(HttpClient)

  convertCurrency(from:string,to:string,amount:number){

    const headers=new HttpHeaders({
      "X-RapidAPI-Key":"ebe8049d8amshf84c21f06d981fep187b68jsndc8a94ae17b6",
      "X-RapidAPI-Host":"currency-conversion-and-exchange-rates.p.rapidapi.com"
    })

    return this.http.get<any>("https://currency-conversion-and-exchange-rates.p.rapidapi.com/convert",{headers:headers, params:{from:from,to:to,amount:amount}})
  }
}