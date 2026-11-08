import express from 'express'
import { UserControler } from '../contolers/UserControler'
import { AeroDataBoxControler } from '../contolers/AeroDataBoxControler'
import { TravelBuddyControler } from '../contolers/TravelBuddyControler'
import { TravelDocumentController } from '../contolers/TravelDocumentController'
import { NotificationController } from '../contolers/NotificationController'
import { PasswordResetController } from '../contolers/PasswordResetController'

const ruterBaza=express.Router()


ruterBaza.route('/user/login').post(
    (req, res) => new UserControler().login(req, res)
)
ruterBaza.route('/user/register').post(
    (req, res) => new UserControler().register(req, res)
)
ruterBaza.route('/user/addFlight').post(
    (req, res) => new UserControler().addFlight(req, res)
)
ruterBaza.route('/user/addSecondaryDocument').post(
    (req, res) => new UserControler().addSecondaryDocument(req, res)
)
ruterBaza.route('/user/deleteSecondaryDocument').post(
    (req, res) => new UserControler().deleteSecondaryDocument(req, res)
)
ruterBaza.route('/user/change').post(
    (req, res) => new UserControler().change(req, res)
)
ruterBaza.route('/user/changePassword').post(
    (req, res) => new UserControler().changePassword(req, res)
)
ruterBaza.route('/user/changePrimaryDocument').post(
    (req, res) => new UserControler().changePrimaryDocument(req, res)
)
ruterBaza.route('/user/updateTrackedFlights').put(
    (req,res)=>new UserControler().updateTrackedFlights(req,res)
)
ruterBaza.route('/user/getAllUsers').get(
    (req,res)=>new UserControler().getAllUsers(req,res)
)
ruterBaza.route('/user/deleteUser').delete(
    (req,res)=>new UserControler().deleteUser(req,res)
)


ruterBaza.route('/notification/add').post(
    (req, res) => new NotificationController().addNotification(req, res)
)
ruterBaza.route('/notification/get/:userId').get(
    (req, res) => new NotificationController().getNotificationsByUserId(req, res)
)
ruterBaza.route('/notification/read/:notificationId').put(
    (req,res)=>new NotificationController().markAsRead(req,res)
)


ruterBaza.route('/travelDocument/addDocument').post(
    (req, res) => new TravelDocumentController().addDocument(req, res)
)
ruterBaza.route('/travelDocument/getTravelDocument').post(
    (req, res) => new TravelDocumentController().getDocumentById(req, res)
)


ruterBaza.route("/aerodatabox/airports/search").get(
    (req,res)=>new AeroDataBoxControler().searchAirports(req,res)
)
ruterBaza.route("/aerodatabox/flights/search").get(
    (req,res)=>new AeroDataBoxControler().searchFlights(req,res)
)


ruterBaza.route("/travel/check").post(
    (req,res)=>new TravelBuddyControler().checkRequirements(req,res)
)

ruterBaza.route('/password/request').post(
    (req,res)=>new PasswordResetController().requestPasswordReset(req,res)
)

ruterBaza.route('/password/validate/:token').get(
    (req,res)=>new PasswordResetController().validateToken(req,res)
)

ruterBaza.route('/password/reset').post(
    (req,res)=>new PasswordResetController().resetPassword(req,res)
)


export default ruterBaza

