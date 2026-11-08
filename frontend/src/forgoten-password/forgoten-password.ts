import {CommonModule} from '@angular/common'
import {Component,inject} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {RouterLink} from '@angular/router'
import {TranslatePipe} from '@ngx-translate/core'
import {PasswordResetService} from '../services/password-reset-service'

@Component({
  selector:'app-forgoten-password',
  imports:[CommonModule,FormsModule,RouterLink,TranslatePipe],
  templateUrl:'./forgoten-password.html',
  styleUrl:'./forgoten-password.css'
})
export class ForgotenPassword {

  passwordResetService=inject(PasswordResetService)

  email=""

  messageKey=""
  errorMessageKey=""

  isSending=false

  sendResetLink(){

    this.messageKey=""
    this.errorMessageKey=""

    if(this.email.trim()==""){
      this.errorMessageKey="FORGOT_PASSWORD.ERROR_EMAIL_REQUIRED"
      return
    }

    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(!emailRegex.test(this.email)){
      this.errorMessageKey="FORGOT_PASSWORD.ERROR_EMAIL_INVALID"
      return
    }

    this.isSending=true

    this.passwordResetService.requestPasswordReset(this.email).subscribe({

      next:()=>{

        this.isSending=false
        this.messageKey="FORGOT_PASSWORD.SUCCESS"

      },

      error:error=>{


        this.isSending=false
        this.errorMessageKey="FORGOT_PASSWORD.ERROR_SEND"

      }
    })
  }
}