import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  let user = localStorage.getItem("loggedUser");

  if(user){
    return true;
  }

  router.navigate(["/login"]);
  return false;
};
