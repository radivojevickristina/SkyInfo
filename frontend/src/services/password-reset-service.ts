import {HttpClient} from '@angular/common/http'
import {inject,Injectable} from '@angular/core'

@Injectable({
  providedIn:'root'
})
export class PasswordResetService {

  private http=inject(HttpClient)

  private backendUrl="http://localhost:4000"


  requestPasswordReset(email:string){

    return this.http.post<{message:string}>(
      `${this.backendUrl}/password/request`,
      {
        email:email
      }
    )
  }


  validateToken(token:string){

    return this.http.get<{valid:boolean}>(
      `${this.backendUrl}/password/validate/${token}`
    )
  }


  resetPassword(
    token:string,
    newPassword:string
  ){

    return this.http.post<{success:boolean}>(
      `${this.backendUrl}/password/reset`,
      {
        token:token,
        newPassword:newPassword
      }
    )
  }
}