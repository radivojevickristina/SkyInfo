export class Notification {
  _id:string=""
  userId:string=""
  type:string=""
  severity:string=""
  titleKey:string=""
  messageKey:string=""
  params:Record<string,any>={}
  uniqueKey:string=""
  read:boolean=false
  readAt:Date | null=null
  actionRoute:string=""
  createdAt:Date=new Date()
}