import {AfterViewInit,Component,inject,OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {Router} from '@angular/router'
import {TranslatePipe,TranslateService} from '@ngx-translate/core'
import {getMapData,show3dMap} from '@mappedin/mappedin-js'
import {User} from '../models/User'
import {TravelDocument} from '../models/TravelDocument'

interface NavigationLocation {
  id:string
  name:string
  floorName:string
  target:any
}

interface FloorOption {
  id:string
  name:string
  elevation:number
}

@Component({
  selector:'app-user-map',
  imports:[CommonModule,FormsModule,TranslatePipe],
  templateUrl:'./user-map.html',
  styleUrl:'./user-map.css',
})
export class UserMap implements OnInit,AfterViewInit {

  router=inject(Router)
  translate=inject(TranslateService)

  user=new User()
  primaryDocument=new TravelDocument()

  currentLanguage="sr"

  serbianLanguageNationalities=["SRB","BIH","MNE","HRV"]
  spanishLanguageNationalities=["ESP","MEX","ARG","BOL","CHL","COL","CRI","CUB","DOM","ECU","SLV","GNQ","GTM","HND","NIC","PAN","PRY","PER","URY","VEN"]

  profileMenuOpen=false

  mapData:any=null
  mapView:any=null

  floors:FloorOption[]=[]
  navigationLocations:NavigationLocation[]=[]

  selectedFloorId=""
  startLocationId=""
  destinationLocationId=""

  navigationMessageKey=""
  navigationMessageParams:Record<string,any>={}

  isMapLoading=true
  isNavigating=false

  navigationSteps:any[]=[]
  totalDistance=0

  navigationOpen=false
  currentNavigationStep=0

  ngOnInit():void{

    const loggedUser=localStorage.getItem("loggedUser")

    if(!loggedUser){
      this.router.navigate(["/login"])
      return
    }

    this.user=JSON.parse(loggedUser)
    this.primaryDocument=this.user.primaryTravelDocument

    const lang=localStorage.getItem("language")
    if(lang){
      this.currentLanguage=lang
      this.translate.use(this.currentLanguage)
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

  getLanguageByNationality(nationality:string):string{

    const normalizedNationality=String(nationality || "").trim().toUpperCase()

    if(this.serbianLanguageNationalities.includes(normalizedNationality)){
      return "sr"
    }

    if(this.spanishLanguageNationalities.includes(normalizedNationality)){
      return "es"
    }

    return "en"
  }

  changeLanguage(language:string){

    if(language!="sr" && language!="en" && language!="es"){
      return
    }

    this.currentLanguage=language
    localStorage.setItem("language",language)
    this.translate.use(language)
  }

  openNavigation(){

    if(this.navigationSteps.length==0){
      return
    }

    this.navigationOpen=true
    this.currentNavigationStep=0
  }

  closeNavigation(){
    this.navigationOpen=false
    this.currentNavigationStep=0
  }

  nextNavigationStep(){

    if(this.currentNavigationStep<this.navigationSteps.length-1){
      this.currentNavigationStep++
    }
  }

  previousNavigationStep(){

    if(this.currentNavigationStep>0){
      this.currentNavigationStep--
    }
  }

  getNavigationStepIcon(step:any):string{

    const action=step?.action

    if(!action){
      return "↑"
    }

    if(action.type=="Departure"){
      return "↑"
    }

    if(action.type=="Arrival"){
      return "✓"
    }

    if(action.type=="TakeVortex"){

      if(action.direction=="up"){
        return "↑"
      }

      if(action.direction=="down"){
        return "↓"
      }

      return "↕"
    }

    if(action.type=="ExitVortex"){
      return "↑"
    }

    if(action.type=="Turn"){

      switch(action.bearing){

        case "Left":
          return "↰"

        case "Right":
          return "↱"

        case "SlightLeft":
          return "↖"

        case "SlightRight":
          return "↗"

        case "Straight":
          return "↑"

        case "Back":
          return "↓"

        default:
          return "↑"
      }
    }

    return "↑"
  }

  getNavigationStepDistance(step:any):string{

    const distance=Number(step?.distance || 0)

    if(distance<=0){
      return ""
    }

    if(distance<1){
      return this.translate.instant("MAP.FEW_METERS")
    }

    return Math.round(distance)+" m"
  }


  async ngAfterViewInit(){

    const options={
      key: '5eab30aa91b055001a68e996',
      secret: 'RJyRXKcryCMy4erZqqCbuB1NbR66QTGNXVE0x3Pg6oCIlUR1',
      mapId: 'mappedin-demo-airport'
    }

    const mapElement=document.getElementById("mappedin-map")

    if(!mapElement){
      return
    }

    try{

      this.mapData=await getMapData(options)
      this.mapView=await show3dMap(mapElement,this.mapData)

      const spaces=this.mapData.getByType("space")

      spaces.forEach((space:any)=>{

        if(space.name && space.name.trim()!=""){
          this.mapView.Labels.add(space,space.name)
        }
      })

      const mapFloors=this.mapData.getByType("floor")

      this.floors=mapFloors.map((floor:any)=>{

        return {
          id:floor.id,
          name:floor.name || "",
          elevation:floor.elevation
        }

      }).sort((first:FloorOption,second:FloorOption)=>{
        return first.elevation-second.elevation
      })

      if(this.mapView.currentFloor){
        this.selectedFloorId=this.mapView.currentFloor.id
      }

      this.mapView.on("floor-change",(event:any)=>{

        if(event?.floor){
          this.selectedFloorId=event.floor.id
        }
      })

      const enterpriseLocations=this.mapData.getByType("enterprise-location").filter((location:any)=>{
        return location.name && location.name.trim()!=""
      })

      this.navigationLocations=enterpriseLocations.map((location:any)=>{

        let floorName=""

        if(location.spaces && location.spaces.length>0){
          floorName=location.spaces[0].floor?.name || ""
        }

        return {
          id:location.id,
          name:location.name,
          floorName:floorName,
          target:location
        }

      }).sort((first:NavigationLocation,second:NavigationLocation)=>{
        return first.name.localeCompare(second.name)
      })

      if(this.navigationLocations.length==0){

        const navigationSpaces=this.mapData.getByType("space").filter((space:any)=>{
          return space.name && space.name.trim()!=""
        })

        this.navigationLocations=navigationSpaces.map((space:any)=>{

          return {
            id:space.id,
            name:space.name,
            floorName:space.floor?.name || "",
            target:space
          }

        }).sort((first:NavigationLocation,second:NavigationLocation)=>{
          return first.name.localeCompare(second.name)
        })
      }

      this.isMapLoading=false

    }
    catch(error){


      this.navigationMessageKey="MAP.ERROR_UNAVAILABLE"
      this.navigationMessageParams={}
      this.isMapLoading=false
    }
  }

  async changeFloor(){

    if(!this.mapView || !this.selectedFloorId){
      return
    }

    const floor=this.mapData.getById("floor",this.selectedFloorId)

    if(!floor){
      return
    }

    await this.mapView.setFloor(floor)
  }

  async showDirections(){

    this.navigationMessageKey=""
    this.navigationMessageParams={}

    if(!this.startLocationId || !this.destinationLocationId){
      this.navigationMessageKey="MAP.ERROR_SELECT_POINTS"
      return
    }

    if(this.startLocationId==this.destinationLocationId){
      this.navigationMessageKey="MAP.ERROR_SAME_POINTS"
      return
    }

    const startLocation=this.navigationLocations.find(location=>{
      return location.id==this.startLocationId
    })

    const destinationLocation=this.navigationLocations.find(location=>{
      return location.id==this.destinationLocationId
    })

    if(!startLocation || !destinationLocation){
      this.navigationMessageKey="MAP.ERROR_LOCATION_NOT_FOUND"
      return
    }

    try{

      this.isNavigating=true

      this.mapView.Navigation.clear()

      const directions=await this.mapData.getDirections(
        startLocation.target,
        destinationLocation.target
      )

      if(!directions){
        this.navigationMessageKey="MAP.ERROR_NO_ROUTE"
        return
      }

      this.navigationSteps=directions.instructions || []
      this.totalDistance=Math.round(directions.distance || 0)

      this.currentNavigationStep=0
      this.navigationOpen=false

      await this.mapView.Navigation.draw(
        directions,
        {
          setMapToDeparture:true,
          setMapOnConnectionClick:true,
          animatePathDrawing:true,
          pathOptions:{
            displayArrowsOnPath:true,
            animateArrowsOnPath:true
          }
        }
      )

      this.navigationMessageKey="MAP.ROUTE_TEMPLATE"
      this.navigationMessageParams={
        start:startLocation.name,
        destination:destinationLocation.name
      }

    }
    catch(error){


      this.navigationMessageKey="MAP.ERROR_ROUTE"
      this.navigationMessageParams={}
    }
    finally{
      this.isNavigating=false
    }
  }

  clearDirections(){

    if(!this.mapView){
      return
    }

    this.mapView.Navigation.clear()

    this.startLocationId=""
    this.destinationLocationId=""
    this.navigationMessageKey=""
    this.navigationMessageParams={}
    this.navigationSteps=[]
    this.totalDistance=0
    this.navigationOpen=false
    this.currentNavigationStep=0
  }

  getNavigationInstruction(step:any):string{

    const action=step.action

    if(!action){
      return this.translate.instant("MAP.NAV_CONTINUE")
    }

    if(action.type=="Departure"){
      return this.translate.instant("MAP.NAV_START")
    }

    if(action.type=="Arrival"){
      return this.translate.instant("MAP.NAV_ARRIVED")
    }

    if(action.type=="TakeVortex"){

      const floorName=action.toFloor?.name ? this.getFloorName(action.toFloor.name) : this.translate.instant("MAP.NEXT_FLOOR")

      if(action.direction=="up"){
        return this.translate.instant("MAP.NAV_GO_UP",{floor:floorName})
      }

      if(action.direction=="down"){
        return this.translate.instant("MAP.NAV_GO_DOWN",{floor:floorName})
      }

      return this.translate.instant("MAP.NAV_MOVE_TO",{floor:floorName})
    }

    if(action.type=="ExitVortex"){
      return this.translate.instant("MAP.NAV_EXIT_VERTICAL")
    }

    if(action.type=="Turn"){

      switch(action.bearing){

        case "Left":
          return this.translate.instant("MAP.NAV_LEFT")

        case "Right":
          return this.translate.instant("MAP.NAV_RIGHT")

        case "SlightLeft":
          return this.translate.instant("MAP.NAV_SLIGHT_LEFT")

        case "SlightRight":
          return this.translate.instant("MAP.NAV_SLIGHT_RIGHT")

        case "Straight":
          return this.translate.instant("MAP.NAV_STRAIGHT")

        case "Back":
          return this.translate.instant("MAP.NAV_BACK")

        default:
          return this.translate.instant("MAP.NAV_CONTINUE")
      }
    }

    return this.translate.instant("MAP.NAV_CONTINUE")
  }

  swapLocations(){

    const oldStart=this.startLocationId

    this.startLocationId=this.destinationLocationId
    this.destinationLocationId=oldStart
  }

  toggleProfileMenu(){
    this.profileMenuOpen=!this.profileMenuOpen
  }

  closeProfileMenu(){
    this.profileMenuOpen=false
  }

  odjaviSe(){

    localStorage.removeItem("loggedUser")
    this.router.navigate(["login"])
  }
}