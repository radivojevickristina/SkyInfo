import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = () => {
  const ruter = inject(Router);
  const logged = JSON.parse(localStorage.getItem('loggedUser') || 'null');

  if (logged) {
    if (!logged.admin ) ruter.navigate(['user/main'])
    else if (logged.admin) ruter.navigate(['admin/main'])
    return false
  }

  return true
}