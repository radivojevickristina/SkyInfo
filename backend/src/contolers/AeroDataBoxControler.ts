import express from "express"
import axios from "axios"

export class AeroDataBoxControler {

  private getBaseUrl(){
    if(!process.env.AERODATABOX_BASE_URL){
      throw new Error("AERODATABOX_BASE_URL nije pronađen")
    }

    return process.env.AERODATABOX_BASE_URL
  }

  private getHeaders(){
    if(!process.env.AERODATABOX_API_KEY || !process.env.AERODATABOX_API_HOST){
      throw new Error("AeroDataBox podaci nisu pronađeni")
    }

    return {
      "x-rapidapi-key":process.env.AERODATABOX_API_KEY,
      "x-rapidapi-host":process.env.AERODATABOX_API_HOST,
      "Accept":"application/json"
    }
  }

  private getTodayDate(){
    return new Date().toISOString().split("T")[0]
  }

  private isDateValid(date:string){
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime())
  }

  private airportMatches(airport:any,code:string){
    if(code==""){
      return true
    }

    const searchedCode=code.toUpperCase()
    const iata=String(airport?.iata || "").toUpperCase()
    const icao=String(airport?.icao || "").toUpperCase()

    return iata==searchedCode || icao==searchedCode
  }

  private createAirportReference(airportCode:string){
    const code=airportCode.trim().toUpperCase()

    if(code.length==3){
      return {iata:code}
    }

    return {icao:code}
  }

  private addSearchedAirportsToFlight(flight:any,departureAirport:string,arrivalAirport:string){
    const normalizedFlight={...flight,departure:{...(flight?.departure || {})},arrival:{...(flight?.arrival || {})}}

    if(departureAirport!=""){
      normalizedFlight.departure.airport={...(normalizedFlight.departure.airport || {}),...this.createAirportReference(departureAirport)}
    }

    if(arrivalAirport!=""){
      normalizedFlight.arrival.airport={...(normalizedFlight.arrival.airport || {}),...this.createAirportReference(arrivalAirport)}
    }

    return normalizedFlight
  }

  private mapAirport(airport:any){
    return {
      name:String(airport?.name || "").trim(),
      shortName:String(airport?.shortName || "").trim(),
      city:String(airport?.municipalityName || airport?.shortName || airport?.name || "").trim(),
      countryCode:String(airport?.countryCode || "").trim(),
      icao:String(airport?.icao || "").trim().toUpperCase(),
      iata:String(airport?.iata || "").trim().toUpperCase(),
      timeZone:String(airport?.timeZone || "").trim()
    }
  }

  private mapFlight(flight:any){
    const departure=flight?.departure || {}
    const arrival=flight?.arrival || {}

    const departureAirport=this.mapAirport(departure.airport || {})
    const arrivalAirport=this.mapAirport(arrival.airport || {})

    return {
      flightNumber:String(flight?.number || "").trim(),
      callsign:String(flight?.callSign || flight?.number || "").trim(),
      status:String(flight?.status || "Unknown").trim(),
      airline:String(flight?.airline?.name || "").trim(),
      airlineIata:String(flight?.airline?.iata || "").trim(),
      airlineIcao:String(flight?.airline?.icao || "").trim(),
      aircraftRegistration:String(flight?.aircraft?.reg || "").trim(),
      aircraftModel:String(flight?.aircraft?.model || "").trim(),
      departureAirport:departureAirport.icao,
      departureAirportIata:departureAirport.iata,
      departureCity:departureAirport.city,
      departureAirportName:departureAirport.name,
      departureScheduledTime:departure?.scheduledTime?.local || null,
      departureScheduledTimeUtc:departure?.scheduledTime?.utc || null,
      departureRevisedTime:departure?.revisedTime?.local || null,
      departureTerminal:String(departure?.terminal || "").trim(),
      departureGate:String(departure?.gate || "").trim(),
      departureCheckInDesk:String(departure?.checkInDesk || "").trim(),
      arrivalAirport:arrivalAirport.icao,
      arrivalAirportIata:arrivalAirport.iata,
      arrivalCity:arrivalAirport.city,
      arrivalAirportName:arrivalAirport.name,
      arrivalScheduledTime:arrival?.scheduledTime?.local || null,
      arrivalScheduledTimeUtc:arrival?.scheduledTime?.utc || null,
      arrivalRevisedTime:arrival?.revisedTime?.local || null,
      arrivalTerminal:String(arrival?.terminal || "").trim(),
      arrivalGate:String(arrival?.gate || "").trim(),
      arrivalBaggageBelt:String(arrival?.baggageBelt || "").trim()
    }
  }

  searchAirports=(req:express.Request,res:express.Response)=>{

    const query=String(req.query.q || "").trim()

    if(query.length<3){
      res.json([])
      return
    }

    axios.get(this.getBaseUrl()+"/airports/search/term",{
      params:{
        q:query,
        limit:10,
        withFlightInfoOnly:true,
        withSearchByCode:true
      },
      headers:this.getHeaders(),
      timeout:20000
    }).then(response=>{

      const airports=(response.data?.items || []).map((airport:any)=>this.mapAirport(airport))
      res.json(airports)

    }).catch(error=>{
      this.sendError(error,res,"Greška prilikom pretrage aerodroma")
    })
  }

  private getFlightsByNumber=(flightNumber:string,date:string)=>{

    let url=this.getBaseUrl()+"/flights/number/"+encodeURIComponent(flightNumber)

    if(date!=""){
      url+="/"+date
    }

    return axios.get(url,{
      params:{
        dateLocalRole:"Both",
        withAircraftImage:false,
        withLocation:false,
        withFlightPlan:false
      },
      headers:this.getHeaders(),
      timeout:20000
    }).then(response=>{

      return Array.isArray(response.data) ? response.data : []
    })
  }

  private getAirportFlightsForDay=(airportCode:string,date:string,direction:"Departure" | "Arrival")=>{

    const allFlights:any[]=[]
    const codeType=airportCode.length==3 ? "iata" : "icao"
    const ranges=[[date+"T00:00",date+"T11:59"],[date+"T12:00",date+"T23:59"]]
    const getRange=(index:number):Promise<any[]>=>{

      if(index>=ranges.length){
        return Promise.resolve(allFlights)
      }

      const range=ranges[index]
      const url=this.getBaseUrl()+"/flights/airports/"+codeType+"/"+encodeURIComponent(airportCode)+"/"+encodeURIComponent(range[0])+"/"+encodeURIComponent(range[1])
      const delay=index>0 ? new Promise(resolve=>setTimeout(resolve,1200)) : Promise.resolve()

      return delay.then(()=>{
        return axios.get(url,{
          params:{
            direction:direction,
            withLeg:true,
            withCancelled:true,
            withCodeshared:true,
            withCargo:false,
            withPrivate:false,
            withLocation:false
          },
          headers:this.getHeaders(),
          timeout:20000
        })

      }).then(response=>{

        const flights=direction=="Departure" ? response.data?.departures || [] : response.data?.arrivals || []
        allFlights.push(...flights)
        return getRange(index+1)

      }).catch(error=>{

        if(error.response?.status==204){
          return getRange(index+1)
        }

        return Promise.reject(error)
      })
    }

    return getRange(0)
  }

  private removeDuplicates(flights:any[]){
    const keys=new Set<string>()

    return flights.filter(flight=>{
      const key=String(flight?.number || "")+"|"+String(flight?.departure?.scheduledTime?.local || "")+"|"+String(flight?.arrival?.scheduledTime?.local || "")

      if(keys.has(key)){
        return false
      }

      keys.add(key)
      return true
    })
  }

  searchFlights=(req:express.Request,res:express.Response)=>{

    const flightNumber=String(req.query.flightNumber || "").trim().replace(/\s/g,"").toUpperCase()
    let date=String(req.query.date || "").trim()
    const departureAirport=String(req.query.departureAirport || "").trim().toUpperCase()
    const arrivalAirport=String(req.query.arrivalAirport || "").trim().toUpperCase()

    if(flightNumber=="" && date=="" && departureAirport=="" && arrivalAirport==""){
      res.json({message:"Unesite broj leta, datum ili aerodrom"})
      return
    }

    if(date!="" && !this.isDateValid(date)){
      res.json({message:"Datum mora biti u formatu YYYY-MM-DD"})
      return
    }

    if(date!="" && flightNumber=="" && departureAirport=="" && arrivalAirport==""){
      res.json({message:"Uz datum unesite broj leta ili izaberite aerodrom"})
      return
    }

    let flightsPromise:Promise<any[]>

    if(flightNumber!=""){
      flightsPromise=this.getFlightsByNumber(flightNumber,date)
    }else{

      if(date==""){
        date=this.getTodayDate()
      }

      const airportCode=departureAirport || arrivalAirport
      const direction:"Departure" | "Arrival"=departureAirport!="" ? "Departure" : "Arrival"

      flightsPromise=this.getAirportFlightsForDay(airportCode,date,direction)
    }

    flightsPromise.then(flights=>{

      if(flightNumber!=""){
        flights=flights.filter(flight=>this.airportMatches(flight?.departure?.airport,departureAirport) && this.airportMatches(flight?.arrival?.airport,arrivalAirport))
      }else if(departureAirport!="" && arrivalAirport!=""){
        flights=flights.filter(flight=>this.airportMatches(flight?.arrival?.airport,arrivalAirport))
      }

      flights=flights.map(flight=>this.addSearchedAirportsToFlight(flight,departureAirport,arrivalAirport))

      if(flightNumber==""){
        flights=this.removeDuplicates(flights)
      }

      const result=flights.map(flight=>this.mapFlight(flight)).sort((first:any,second:any)=>new Date(first.departureScheduledTime || 0).getTime()-new Date(second.departureScheduledTime || 0).getTime())

      res.json({
        date:date,
        numberOfFlights:result.length,
        flights:result
      })

    })
  }

  private sendError(error:any,res:express.Response,defaultMessage:string){
    const status=error.response?.status

    if(status==204){
      res.json({numberOfFlights:0,flights:[]})
      return
    }

    if(status==401 || status==403){
      res.json({message:"AeroDataBox ključ nije ispravan ili nalog nema pristup endpointu"})
      return
    }

    if(status==429){
      res.json({message:"Potrošeno je ograničenje AeroDataBox zahteva"})
      return
    }

    if(status==400){
      res.json({message:error.response?.data?.message || defaultMessage})
      return
    }

    res.json({message:defaultMessage})
  }
}