import {CommonModule} from '@angular/common'
import {Component,inject,OnInit} from '@angular/core'
import {Router} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'

@Component({
  selector:'app-main-page',
  imports:[CommonModule,TranslatePipe],
  templateUrl:'./main-page.html',
  styleUrl:'./main-page.css',
})
export class MainPage implements OnInit {

  private readonly router=inject(Router)
  translate=inject(TranslateService)

  currentLanguage="sr"
  isTakingOff=false
  destination=""

  ngOnInit(){

    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es"){
      this.currentLanguage=savedLanguage
    }
    else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
  }

  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
  }

  startTakeoff(destination:string):void{

    if(this.isTakingOff){
      return
    }

    this.isTakingOff=true
    this.destination=destination

    setTimeout(()=>{
      this.router.navigate([destination])
    },1550)
  }
}