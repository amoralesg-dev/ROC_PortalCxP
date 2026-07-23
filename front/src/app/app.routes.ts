import { Router,Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { PagosTable } from './components/pagos-table/pagos-table';
import { PagosEnviadosComponent } from './components/pagos-enviados/pagos-enviados';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PagosErroresComponent } from './components/pagos-errores/pagos-errores';
import { PagosAnaliticaComponent } from './components/pagos-analitica/pagos-analitica';

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
  { path: 'pagos-errores', component: PagosErroresComponent, canActivate: [authGuard] },
  { path: 'pagos-analitica', component: PagosAnaliticaComponent, canActivate: [authGuard]},
  { path: '**', redirectTo: '/pagos-pendientes' }
];
