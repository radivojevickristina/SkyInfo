export interface VisaRule {
    name:string
    duration?:string | null
    color?:string
    link?:string
}

export interface MandatoryRegistration {
    name:string
    color?:string
    link?:string
}

export interface TravelRequirements {
    data:{
        passport:{
            code:string
            name:string
            currency_code?:string
        }

        destination:{
            code:string
            name:string
            continent?:string
            capital?:string
            currency_code?:string
            currency?:string
            passport_validity?:string
            phone_code?:string
            timezone?:string
            embassy_url?:string
        }

        mandatory_registration?:MandatoryRegistration | null

        visa_rules:{

            primary_rule:VisaRule

            secondary_rule?:VisaRule | null

            exception_rule?:{
                name?:string
                full_text?:string
                link?:string
            } | null
        }
    }

    meta?:{
        version?:string
        language?:string
        generated_at?:string
    }

    documentCheck:{
        validOnTravelDate:boolean
        daysRemaining:number
        expirationDate:string
        travelDate:string
    } | null
}