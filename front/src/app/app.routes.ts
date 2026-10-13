import { Router,Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { PagosTable } from './components/pagos-table/pagos-table';
import { PagosEnviadosComponent } from './components/pagos-enviados/pagos-enviados';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PagosErroresComponent } from './components/pagos-errores/pagos-errores';
import { PagosAnaliticaComponent } from './components/pagos-analitica/pagos-analitica';
import { PagosPendientesComponent } from './components/pagos-pendientes/pagos-pendientes';

import { CallbackComponent } from './components/callback/callback.component';
import { AuthenticationService } from 'rassini-ui';

export const authGuard = () => {
  const authService = inject(AuthService);
  const corporateAuth = inject(AuthenticationService, { optional: true });
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Si existe sesión OIDC activa en el navegador, intentar SSO silencioso
  if (corporateAuth) {
    if (corporateAuth.hasValidTokenInStorage()) {
      authService.syncFromCorporateOidc();
      return true;
    }
  }

  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { path: 'callback', component: CallbackComponent },
  { path: 'login', component: LoginComponent },
  { path: 'pagos-pendientes', component: PagosPendientesComponent, canActivate: [authGuard] },
  { path: 'pagos-enviados', component: PagosEnviadosComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/pagos-pendientes', pathMatch: 'full' },
  { path: 'pagos-errores', component: PagosErroresComponent, canActivate: [authGuard] },
  { path: 'pagos-analitica', component: PagosAnaliticaComponent, canActivate: [authGuard]},
  { path: '**', redirectTo: '/pagos-pendientes' }
];
