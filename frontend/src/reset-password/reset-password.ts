import {CommonModule} from '@angular/common'
import {Component,inject,OnInit} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {ActivatedRoute,Router,RouterLink} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {PasswordResetService} from '../services/password-reset-service'

@Component({
  selector:'app-reset-password',
  imports:[
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe
  ],
  templateUrl:'./reset-password.html',
  styleUrl:'./reset-password.css'
})
export class ResetPassword implements OnInit {

  route=inject(ActivatedRoute)
  router=inject(Router)
  translate=inject(TranslateService)
  passwordResetService=inject(PasswordResetService)

  token=""

  newPassword=""
  repeatPassword=""

  messageKey=""

  isCheckingToken=true
  tokenValid=false
  isSaving=false


  ngOnInit():void{

    localStorage.removeItem("loggedUser")

    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.translate.use(savedLanguage)
    }

    const token=this.route.snapshot.queryParamMap.get("token")

    if(!token){

      this.isCheckingToken=false
      this.tokenValid=false
      this.messageKey="RESET_PASSWORD.ERROR_INVALID_LINK"

      return
    }

    this.token=token

    this.passwordResetService.validateToken(this.token).subscribe({

      next:data=>{

        this.isCheckingToken=false
        this.tokenValid=data.valid

        if(!data.valid){
          this.messageKey="RESET_PASSWORD.ERROR_INVALID_LINK"
        }
      },

      error:()=>{

        this.isCheckingToken=false
        this.tokenValid=false
        this.messageKey="RESET_PASSWORD.ERROR_INVALID_LINK"

      }
    })
  }


  checkPassword(password:string):boolean{

    if(password.length<8 || password.length>12){
      return false
    }

    if(!/^[a-zA-Z]/.test(password)){
      return false
    }

    if(!/[A-Z]/.test(password)){
      return false
    }

    if(!/\d/.test(password)){
      return false
    }

    if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)){
      return false
    }

    return true
  }


  changePassword(){

    this.messageKey=""

    if(!this.newPassword){
      this.messageKey="RESET_PASSWORD.ERROR_PASSWORD_REQUIRED"
      return
    }

    if(!this.repeatPassword){
      this.messageKey="RESET_PASSWORD.ERROR_REPEAT_REQUIRED"
      return
    }

    if(!this.checkPassword(this.newPassword)){
      this.messageKey="RESET_PASSWORD.ERROR_PASSWORD_INVALID"
      return
    }

    if(this.newPassword!=this.repeatPassword){
      this.messageKey="RESET_PASSWORD.ERROR_PASSWORD_MISMATCH"
      return
    }

    this.isSaving=true

    this.passwordResetService
      .resetPassword(this.token,this.newPassword)
      .subscribe({

        next:()=>{

          this.isSaving=false

          alert(
            this.translate.instant(
              "RESET_PASSWORD.SUCCESS"
            )
          )

          this.router.navigate(["/login"])
        },

        error:error=>{


          this.isSaving=false
          this.messageKey="RESET_PASSWORD.ERROR_INVALID_LINK"

        }
      })
  }
}