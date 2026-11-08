import { Component, inject } from '@angular/core';
import { UserService } from '../services/user-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {

  username=""
  password=""
  messageKey=""
  showPassword=false

  service=inject(UserService)
  router=inject(Router)

  login(){

    this.messageKey=""

    if(this.username=="" || this.password==""){
      this.messageKey="LOGIN.ERROR_REQUIRED"
      return
    }

    this.service.login(
      this.username,
      this.password
    ).subscribe(data=>{

        if(!data){
          this.messageKey="LOGIN.ERROR_WRONG_CREDENTIALS"
          return
        }
        if(data.admin) {
          localStorage.setItem("loggedUser",JSON.stringify(data))
          this.router.navigate(['admin/main'])
        }

        else{
          this.messageKey="LOGIN.ERROR_WRONG_CREDENTIALS"
          return
        }

    })
  }

  togglePassword(){
    this.showPassword=!this.showPassword
  }
}
