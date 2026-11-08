import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { createWorker, PSM } from 'tesseract.js';
import { TravelDocument } from '../models/TravelDocument';
import { User } from '../models/User';
import { UserService } from '../services/user-service';
import { TravelDocumentService } from '../services/travel-document-service';
@Component({
    selector: 'app-user-document',
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './user-document.html',
    styleUrl: './user-document.css',
})
export class UserDocument implements OnInit, OnDestroy {
    user = new User();
    primaryDocument = new TravelDocument();
    secondaryTravelDocuments: TravelDocument[] = [];
    userService = inject(UserService);
    ruter = inject(Router);
    translate = inject(TranslateService);
    currentLanguage = "sr";
    serbianLanguageNationalities = ["SRB", "BIH", "MNE", "HRV"];
    spanishLanguageNationalities = ["ESP", "MEX", "ARG", "BOL", "CHL", "COL", "CRI", "CUB", "DOM", "ECU", "SLV", "GNQ", "GTM", "HND", "NIC", "PAN", "PRY", "PER", "URY", "VEN"];
    profileMenuOpen = false;
    addingDocument = false;
    secondaryFirstName = "";
    secondaryLastName = "";
    secondaryDocumentType = "";
    secondaryDocumentNumber = "";
    secondaryNationality = "";
    secondaryDateOfBirth = new Date();
    secondarySex = "";
    secondaryExpirationDate = new Date();
    passportImage = "";
    passportPreview = "";
    passportFileName = "";
    passportRead = false;
    isReadingPassport = false;
    messageKey = "";
    changingPrimaryDocument = false;
    ngOnInit(): void {
        const loggedUser = localStorage.getItem("loggedUser");
        if (!loggedUser) {
            this.ruter.navigate(["/login"]);
            return;
        }
        this.user = JSON.parse(loggedUser);
        this.primaryDocument = this.user.primaryTravelDocument;
        if (this.user.secondaryTravelDocuments) {
            this.secondaryTravelDocuments = this.user.secondaryTravelDocuments;
        }

        const lang=localStorage.getItem("language")
        if(lang){
            this.currentLanguage=lang
            this.translate.use(this.currentLanguage)
        }
    }
    getLanguageByNationality(nationality: string): string {
        const normalizedNationality = String(nationality || "").trim().toUpperCase();
        if (this.serbianLanguageNationalities.includes(normalizedNationality)) {
            return "sr";
        }
        if (this.spanishLanguageNationalities.includes(normalizedNationality)) {
            return "es";
        }
        return "en";
    }
    changeLanguage(language: string) {
        if (language != "sr" && language != "en" && language != "es") {
            return;
        }
        this.currentLanguage = language;
        localStorage.setItem("language", language);
        this.translate.use(language);
    }
    getDocumentTypeKey(documentType: string): string {
        if (documentType == "passport") {
            return "COMMON.PASSPORT";
        }
        if (documentType == "identityCard") {
            return "COMMON.IDENTITY_CARD";
        }
        return "COMMON.NOT_AVAILABLE";
    }
    getSexKey(sex: string): string {
        if (sex == "M") {
            return "COMMON.MALE";
        }
        if (sex == "F") {
            return "COMMON.FEMALE";
        }
        if (sex == "X") {
            return "COMMON.OTHER_UNSPECIFIED";
        }
        return "COMMON.NOT_AVAILABLE";
    }
    getServerErrorKey(serverMessage: string | undefined, fallbackKey: string): string {
        const errors: Record<string, string> = {
            "Dokument sa ovim brojem je već registrovan": "API_ERRORS.DOCUMENT_REGISTERED",
            "Dokument nije ispravan": "API_ERRORS.DOCUMENT_INVALID",
            "Korisnik nije pronađen": "API_ERRORS.USER_NOT_FOUND",
            "Greška prilikom promene dokumenta": "DOCUMENTS.ERROR_CHANGE",
            "Greška prilikom dodavanja dokumenta": "DOCUMENTS.ERROR_ADD"
        };
        return errors[serverMessage || ""] || fallbackKey;
    }
    openAddDocument() {
        this.addingDocument = true;
        this.changingPrimaryDocument = false;
        this.secondaryFirstName = "";
        this.secondaryLastName = "";
        this.secondaryDocumentType = "";
        this.secondaryDocumentNumber = "";
        this.secondaryNationality = "";
        this.secondaryDateOfBirth = new Date();
        this.secondarySex = "";
        this.secondaryExpirationDate = new Date();
        this.releasePassportImage();
        this.passportRead = false;
        this.isReadingPassport = false;
        this.messageKey = "";
    }
    openChangePrimaryDocument() {
        this.addingDocument = true;
        this.changingPrimaryDocument = true;
        this.secondaryFirstName = this.primaryDocument.firstName;
        this.secondaryLastName = this.primaryDocument.lastName;
        this.secondaryDocumentType = "";
        this.secondaryDocumentNumber = "";
        this.secondaryNationality = "";
        this.secondaryDateOfBirth = new Date();
        this.secondarySex = "";
        this.secondaryExpirationDate = new Date();
        this.releasePassportImage();
        this.passportRead = false;
        this.isReadingPassport = false;
        this.messageKey = "";
    }
    closeAddDocument() {
        this.addingDocument = false;
        this.changingPrimaryDocument = false;
        this.releasePassportImage();
        this.passportRead = false;
        this.isReadingPassport = false;
        this.messageKey = "";
    }
    changePrimaryDocument() {
        this.messageKey = "";
        if (this.secondaryFirstName.trim() == "" || this.secondaryLastName.trim() == "") {
            this.messageKey = "DOCUMENTS.ERROR_OWNER";
            return;
        }
        if (!this.passportRead) {
            this.messageKey = "DOCUMENTS.ERROR_READ_FIRST";
            return;
        }
        if (this.secondaryDocumentNumber.trim() == "") {
            this.messageKey = "DOCUMENTS.ERROR_NUMBER";
            return;
        }
        const newDocument = new TravelDocument();
        newDocument.firstName = this.primaryDocument.firstName;
        newDocument.lastName = this.primaryDocument.lastName;
        newDocument.documentType = this.secondaryDocumentType;
        newDocument.documentNumber = this.secondaryDocumentNumber;
        newDocument.nationality = this.secondaryNationality;
        newDocument.dateOfBirth = this.secondaryDateOfBirth;
        newDocument.sex = this.secondarySex;
        newDocument.expirationDate = this.secondaryExpirationDate;
        this.userService.changePrimaryDocument(this.user._id, newDocument).subscribe({
            next: updatedUser => {
                if (!updatedUser) {
                    this.messageKey = "DOCUMENTS.ERROR_CHANGE";
                    return;
                }
                this.user = updatedUser;
                this.primaryDocument = updatedUser.primaryTravelDocument;
                localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
                if (!localStorage.getItem("language")) {
                    this.currentLanguage = this.getLanguageByNationality(this.primaryDocument.nationality);
                    this.translate.use(this.currentLanguage);
                }
                this.closeAddDocument();
            },
            error: error => {
                this.messageKey = this.getServerErrorKey(error.error?.message, "DOCUMENTS.ERROR_CHANGE");
            }
        });
    }
    saveDocument() {
        if (this.changingPrimaryDocument) {
            this.changePrimaryDocument();
            return;
        }
        this.addSecondaryDocument();
    }
    async onPassportSelected(event: any) {
        this.messageKey = "";
        this.passportRead = false;
        this.secondaryDocumentType = "";
        this.secondaryDocumentNumber = "";
        this.secondaryNationality = "";
        this.secondaryDateOfBirth = new Date();
        this.secondarySex = "";
        this.secondaryExpirationDate = new Date();
        const file: File = event.target.files[0];
        if (!file) {
            return;
        }
        if (file.type != "image/jpeg" && file.type != "image/png") {
            this.messageKey = "OCR.ALLOWED_FORMATS";
            event.target.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            this.messageKey = "OCR.MAX_SIZE";
            event.target.value = "";
            return;
        }
        this.releasePassportImage();
        const objectUrl = URL.createObjectURL(file);
        this.passportImage = objectUrl;
        this.passportPreview = objectUrl;
        this.passportFileName = file.name;
        await this.readSecondaryDocument();
    }

    async readSecondaryDocument(){

        if(this.passportImage==""){
            this.messageKey="OCR.SELECT_IMAGE"
            return
        }

        this.messageKey="OCR.READING"
        this.isReadingPassport=true
        this.passportRead=false

        let worker:any=null

        try{
            const mrzImage=await this.prepareMrzImage(this.passportImage)

            worker=await createWorker("eng")

            await worker.setParameters({
                tessedit_pageseg_mode:PSM.SINGLE_BLOCK,
                tessedit_char_whitelist:"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"
            })

            const result=await worker.recognize(mrzImage)
            const lines=this.prepareOcrLines(result.data.text)

            let parsedDocument:any=null

            if(lines.length>=2 && lines[0].startsWith("P")){
                parsedDocument=this.parseTd3(lines.slice(0,2))
            }else if(lines.length>=3){
                parsedDocument=this.parseTd1(lines.slice(0,3))
            }

            if(parsedDocument==null){
                this.messageKey="OCR.CANNOT_READ_MRZ"
                return
            }

            this.secondaryDocumentType=parsedDocument.documentType
            this.secondaryDocumentNumber=parsedDocument.documentNumber
            this.secondaryNationality=parsedDocument.nationality
            this.secondaryDateOfBirth=parsedDocument.dateOfBirth
            this.secondarySex=parsedDocument.sex
            this.secondaryExpirationDate=parsedDocument.expirationDate

            this.passportRead=true
            this.messageKey="OCR.READ_SUCCESS"

        }catch(error){
            this.messageKey="OCR.READ_ERROR"
        }finally{
            this.isReadingPassport=false

            if(worker){
                await worker.terminate()
            }
        }
    }

    prepareMrzImage(imageSource:string):Promise<string>{

        return new Promise((resolve,reject)=>{

            const image=new Image()

            image.onload=()=>{

                const sourceY=Math.floor(image.height*0.55)
                const sourceHeight=image.height-sourceY
                const scale=Math.max(2,1600/image.width)

                const canvas=document.createElement("canvas")
                canvas.width=Math.floor(image.width*scale)
                canvas.height=Math.floor(sourceHeight*scale)

                const context=canvas.getContext("2d")

                if(!context){
                    reject(new Error("Canvas nije dostupan"))
                    return
                }

                context.drawImage(image,0,sourceY,image.width,sourceHeight,0,0,canvas.width,canvas.height)

                resolve(canvas.toDataURL("image/png"))
            }

            image.onerror=()=>{
                reject(new Error("Slika nije učitana"))
            }

            image.src=imageSource
        })
    }

    prepareOcrLines(text:string):string[]{

        return text
            .toUpperCase()
            .split(/\r?\n/)
            .map(line=>line.replace(/\s+/g,"").replace(/[^A-Z0-9<]/g,""))
            .filter(line=>line.length>=25)
    }
 
    parseTd3(lines: string[]): any {
        if (lines.length != 2) {
            return null;
        }
        const secondLine = lines[1];
        const documentNumber = secondLine
            .substring(0, 9)
            .replace(/</g, "")
            .trim();
        const nationality = this.normalizeNationality(secondLine.substring(10, 13));
        const birthDate = this.correctNumbers(secondLine.substring(13, 19));
        const readSex = this.correctLetters(secondLine.substring(20, 21));
        const expirationDate = this.correctNumbers(secondLine.substring(21, 27));
        if (documentNumber == "" || nationality == "" || !this.isValidMrzDate(birthDate) || !this.isValidMrzDate(expirationDate)) {
            return null;
        }
        return {
            documentType: "passport",
            documentNumber: documentNumber,
            nationality: nationality,
            dateOfBirth: this.convertMrzDate(birthDate, true),
            sex: this.normalizeSex(readSex),
            expirationDate: this.convertMrzDate(expirationDate, false)
        };
    }

    parseTd1(lines:string[]):any{

        if(lines.length!=3){
            return null
        }

        const firstLine=lines[0]
        const secondLine=lines[1]

        const documentNumber=firstLine.substring(5,14).replace(/</g,"").trim()
        const birthDate=this.correctNumbers(secondLine.substring(0,6))
        const readSex=this.correctLetters(secondLine.substring(7,8))
        const expirationDate=this.correctNumbers(secondLine.substring(8,14))

        let nationality=this.normalizeNationality(secondLine.substring(15,18))

        if(nationality==""){
            nationality=this.normalizeNationality(firstLine.substring(2,5))
        }

        if(documentNumber=="" || !this.isValidMrzDate(birthDate) || !this.isValidMrzDate(expirationDate)){
            return null
        }

        return {
            documentType:"identityCard",
            documentNumber:documentNumber,
            nationality:nationality,
            dateOfBirth:this.convertMrzDate(birthDate,true),
            sex:this.normalizeSex(readSex),
            expirationDate:this.convertMrzDate(expirationDate,false)
        }
    }

    normalizeNationality(value: string): string {
        const nationality = this.correctLetters(value)
            .replace(/</g, "")
            .trim();
        if (nationality == "D") {
            return "DEU";
        }
        return nationality;
    }
    normalizeSex(value: string): string {
        if (value == "M") {
            return "M";
        }
        if (value == "F") {
            return "F";
        }
        if (value == "X") {
            return "X";
        }
        return "";
    }

    
    correctLetters(value: string): string {
        return value
            .toUpperCase()
            .replace(/0/g, "O")
            .replace(/1/g, "I")
            .replace(/2/g, "Z")
            .replace(/5/g, "S")
            .replace(/6/g, "G")
            .replace(/8/g, "B");
    }
    correctNumbers(value: string): string {
        return value
            .toUpperCase()
            .replace(/[OQD]/g, "0")
            .replace(/[IL]/g, "1")
            .replace(/Z/g, "2")
            .replace(/S/g, "5")
            .replace(/G/g, "6")
            .replace(/B/g, "8");
    }
    isValidMrzDate(value: string): boolean {
        if (!/^\d{6}$/.test(value)) {
            return false;
        }
        const year = Number(value.substring(0, 2));
        const month = Number(value.substring(2, 4));
        const day = Number(value.substring(4, 6));
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return false;
        }
        const testDate = new Date(Date.UTC(2000 + year, month - 1, day));
        return (testDate.getUTCMonth() == month - 1 && testDate.getUTCDate() == day);
    }
    convertMrzDate(value: string, birthDate: boolean): Date {
        const shortYear = Number(value.substring(0, 2));
        const month = Number(value.substring(2, 4));
        const day = Number(value.substring(4, 6));
        const currentYear = new Date().getFullYear();
        const currentShortYear = currentYear % 100;
        let fullYear = 2000 + shortYear;
        if (birthDate && shortYear > currentShortYear) {
            fullYear = 1900 + shortYear;
        }
        return new Date(Date.UTC(fullYear, month - 1, day));
    }


    travelDocService=inject(TravelDocumentService)

    addSecondaryDocument() {
        this.messageKey = "";
        if (this.secondaryFirstName.trim() == "" || this.secondaryLastName.trim() == "") {
            this.messageKey = "DOCUMENTS.ERROR_OWNER";
            return;
        }
        if (!this.passportRead) {
            this.messageKey = "DOCUMENTS.ERROR_READ_FIRST";
            return;
        }
        if (this.secondaryDocumentNumber.trim() == "") {
            this.messageKey = "DOCUMENTS.ERROR_NUMBER";
            return;
        }
        const newDocument = new TravelDocument();
        newDocument.firstName = this.secondaryFirstName.trim();
        newDocument.lastName = this.secondaryLastName.trim();
        newDocument.documentType = this.secondaryDocumentType;
        newDocument.documentNumber = this.secondaryDocumentNumber;
        newDocument.nationality = this.secondaryNationality;
        newDocument.dateOfBirth = this.secondaryDateOfBirth;
        newDocument.sex = this.secondarySex;
        newDocument.expirationDate = this.secondaryExpirationDate;

        this.travelDocService.addTravelDocument(newDocument.firstName, newDocument.lastName, newDocument.documentType, newDocument.documentNumber, newDocument.nationality, newDocument.dateOfBirth, newDocument.sex, newDocument.expirationDate ).subscribe(data=>{
            if(data){
                this.userService.addSecondaryDocument(this.user._id, newDocument).subscribe({
                    next: updatedUser => {
                        if (!updatedUser) {
                            this.messageKey = "DOCUMENTS.ERROR_ADD";
                            return;
                        }
                        this.user = updatedUser;
                        this.secondaryTravelDocuments = updatedUser.secondaryTravelDocuments || [];
                        localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
                        this.closeAddDocument();
                    },
                    error: error => {
                        this.messageKey = this.getServerErrorKey(error.error?.message, "DOCUMENTS.ERROR_ADD");
                    }
                });
            }else{
                this.messageKey = "DOCUMENTS.ERROR_ADD";
                return;
            }
        })


    }
    releasePassportImage() {
        if (this.passportImage.startsWith("blob:")) {
            URL.revokeObjectURL(this.passportImage);
        }
        this.passportImage = "";
        this.passportPreview = "";
        this.passportFileName = "";
    }
    ngOnDestroy() {
        this.releasePassportImage();
    }
    deleteSecondaryDocument(documentId: string) {
        this.userService.deleteSecondaryDocument(this.user._id, documentId).subscribe(data => {
            if (data) {
                localStorage.removeItem("loggedUser");
                localStorage.setItem("loggedUser", JSON.stringify(data));
                this.secondaryTravelDocuments = data.secondaryTravelDocuments;
            }
        });
    }
    odjaviSe() {
        localStorage.removeItem("loggedUser");
        this.ruter.navigate(['login']);
    }
    closeProfileMenu() {
        this.profileMenuOpen = false;
    }
    toggleProfileMenu() {
        this.profileMenuOpen = !this.profileMenuOpen;
    }
}
