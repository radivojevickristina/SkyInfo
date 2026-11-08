import { Routes } from '@angular/router';
import { MainPage } from '../main-page/main-page';
import { Login } from '../login/login';
import { Register } from '../register/register';
import { UserMain } from '../user-main/user-main';
import { GuestMain } from '../guest-main/guest-main';
import { GuestVisa } from '../guest-visa/guest-visa';
import { UserVisa } from '../user-visa/user-visa';
import { Profile } from '../profile/profile';
import { UserDocument } from '../user-document/user-document';
import { UserFlights } from '../user-flights/user-flights';
import { GuestMap } from '../guest-map/guest-map';
import { UserMap } from '../user-map/user-map';
import { authGuard } from './guards/auth-guard';
import { About } from '../about/about';
import { ForgotenPassword } from '../forgoten-password/forgoten-password';
import { ResetPassword } from '../reset-password/reset-password';
import { UserNotification } from '../user-notification/user-notification';
import { guestGuard } from './guards/guest-gard';
import { AdminLogin } from '../admin-login/admin-login';
import { AdminMain } from '../admin-main/admin-main';
import { CurrencyComponent } from '../currency-component/currency-component';


export const routes: Routes = [

    {path:"", component:MainPage, canActivate:[guestGuard]},
    {path:"login", component:Login, canActivate:[guestGuard]},
    {path:"register", component:Register, canActivate:[guestGuard]},

    {path:"user/main",component:UserMain,canActivate:[authGuard]},
    {path:"user/visa",component:UserVisa,canActivate:[authGuard]},
    {path:"user/profile",component:Profile,canActivate:[authGuard]},
    {path:"user/documents",component:UserDocument,canActivate:[authGuard]},
    {path:"user/flights",component:UserFlights,canActivate:[authGuard]},
    {path:"user/map",component:UserMap,canActivate:[authGuard]},
    {path:"user/notification",component:UserNotification,canActivate:[authGuard]},

    {path:"forgot-password",component:ForgotenPassword, canActivate:[guestGuard]},
    {path:"reset-password",component:ResetPassword, canActivate:[guestGuard]},
    {path:"guest/main", component:GuestMain, canActivate:[guestGuard]},
    {path:"guest/visa", component:GuestVisa, canActivate:[guestGuard]},
    {path:"guest/map", component:GuestMap, canActivate:[guestGuard]},

    {path:"admin/login", component:AdminLogin},
    {path:"admin/main", component:AdminMain},
    {path:"about",component:About},
    {path:"currency",component:CurrencyComponent}
];
