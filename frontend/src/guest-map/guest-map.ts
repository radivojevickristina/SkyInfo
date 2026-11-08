import {Component,AfterViewInit,OnInit,inject} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {getMapData,show3dMap} from '@mappedin/mappedin-js'
import { FloorOption } from '../models/FloorOption'

@Component({
  selector:'app-guest-map',
  imports:[CommonModule,FormsModule,TranslatePipe],
  templateUrl:'./guest-map.html',
  styleUrl:'./guest-map.css',
})
export class GuestMap implements OnInit,AfterViewInit {

  translate=inject(TranslateService)

  currentLanguage="sr"

  mapData:any=null
  mapView:any=null

  floors:FloorOption[]=[]

  selectedFloorId=""

  isMapLoading=true
  mapMessageKey=""


  ngOnInit(){

    const savedLanguage=localStorage.getItem("language")

    if(savedLanguage=="sr" || savedLanguage=="en" || savedLanguage=="es" || savedLanguage=="tr"){
      this.currentLanguage=savedLanguage
    }
    else{
      this.currentLanguage="sr"
    }

    this.translate.use(this.currentLanguage)
  }


  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es" && language!="tr"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
  }


  async ngAfterViewInit(){

    const options={
      key: '5eab30aa91b055001a68e996',
      secret: 'RJyRXKcryCMy4erZqqCbuB1NbR66QTGNXVE0x3Pg6oCIlUR1',
      mapId: 'mappedin-demo-airport'
    }

    const mapElement=document.getElementById('mappedin-map')

    if(!mapElement){
      this.isMapLoading=false
      this.mapMessageKey="MAP.ERROR_UNAVAILABLE"
      return
    }

    try{

      this.mapData=await getMapData(options)

      this.mapView=await show3dMap(mapElement,this.mapData)

      const spaces=this.mapData.getByType('space')

      spaces.forEach((space:any)=>{
        if(space.name && space.name.trim()!==""){
          this.mapView.Labels.add(space,space.name)
        }
      })

      const mapFloors=this.mapData.getByType('floor')

      this.floors=mapFloors.map((floor:any)=>{
        return {
          id:floor.id,
          name:floor.name || "",
          elevation:floor.elevation
        }
      }).sort((first:FloorOption,second:FloorOption)=>first.elevation-second.elevation)

      if(this.mapView.currentFloor){
        this.selectedFloorId=this.mapView.currentFloor.id
      }

      this.mapView.on('floor-change',(event:any)=>{
        if(event?.floor){
          this.selectedFloorId=event.floor.id
        }
      })

      this.isMapLoading=false
      this.mapMessageKey=""

    }
    catch(error){


      this.isMapLoading=false
      this.mapMessageKey="MAP.ERROR_UNAVAILABLE"
    }
  }

  getFloorName(floorName:string):string{

    if(floorName=="Outdoors"){
      return this.translate.instant("FLOORS.OUTDOORS")
    }

    if(floorName=="Arrivals"){
      return this.translate.instant("FLOORS.ARRIVALS")
    }

    if(floorName=="Departures"){
      return this.translate.instant("FLOORS.DEPARTURES")
    }

    if(floorName=="Departures International"){
      return this.translate.instant("FLOORS.DEPARTURES_INTERNATIONAL")
    }

    if(floorName=="Departures USA"){
      return this.translate.instant("FLOORS.DEPARTURES_USA")
    }

    if(floorName=="Mezzanine"){
      return this.translate.instant("FLOORS.MEZZANINE")
    }

    if(floorName.startsWith("Parking Level")){
      const level=floorName.replace("Parking Level ","")

      return this.translate.instant("FLOORS.PARKING_LEVEL",{
        level:level
      })
    }

    if(floorName.startsWith("Level")){
      const level=floorName.replace("Level ","")

      return this.translate.instant("FLOORS.LEVEL",{
        level:level
      })
    }

    return floorName
  }


  async changeFloor(){

    if(!this.mapView || !this.mapData || !this.selectedFloorId){
      return
    }

    const floor=this.mapData.getById('floor',this.selectedFloorId)

    if(!floor){
      return
    }

    await this.mapView.setFloor(floor)
  }
}