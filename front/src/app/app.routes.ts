import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { PagosTable } from './components/pagos-table/pagos-table';
import { PagosEnviadosComponent } from './components/pagos-enviados/pagos-enviados';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'pagos-pendientes', component: PagosTable, canActivate: [authGuard] },
  { path: 'pagos-enviados', component: PagosEnviadosComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/pagos-pendientes', pathMatch: 'full' },
  { path: '**', redirectTo: '/pagos-pendientes' }
];
