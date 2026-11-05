import { Routes } from '@angular/router';
import { rassiniAuthGuard } from 'rassini-ui';

import { ShellLayoutComponent } from './layout/shell-layout.component';
import { CallbackComponent } from './components/callback/callback.component';
import { LogoutComponent } from './components/logout/logout.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { PagosPendientesComponent } from './components/pagos-pendientes/pagos-pendientes';
import { PagosEnviadosComponent } from './components/pagos-enviados/pagos-enviados';
import { PagosErroresComponent } from './components/pagos-errores/pagos-errores';
import { PagosAnaliticaComponent } from './components/pagos-analitica/pagos-analitica';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import {
  ContingenciaLayoutComponent,
  ContingenciaLoginComponent,
  contingencyGuard
} from './components/contingencia/contingencia';
import { environment } from '../environments/environment';

/**
 * Rutas de CONTINGENCIA temporal. Solo se registran si legacyLoginEnabled=true
 * (local/DEV). En QA/PROD no existen y caen en el wildcard -> /logout.
 */
export const contingencyRoutes: Routes = environment.legacyLoginEnabled
  ? [
      {
        path: 'contingencia',
        children: [
          { path: '', component: ContingenciaLoginComponent },
          {
            path: 'app',
            component: ContingenciaLayoutComponent,
            canActivate: [contingencyGuard],
            canActivateChild: [contingencyGuard],
            children: [
              { path: '', redirectTo: 'pagos-pendientes', pathMatch: 'full' },
              { path: 'pagos-pendientes', component: PagosPendientesComponent },
              { path: 'pagos-enviados', component: PagosEnviadosComponent },
              { path: 'pagos-errores', component: PagosErroresComponent },
              { path: 'pagos-analitica', component: PagosAnaliticaComponent }
            ]
          }
        ]
      }
    ]
  : [];

export const routes: Routes = [
  // 1. Rutas Públicas / Sesión (Fuera del Shell Corporativo)
  {
    path: 'callback',
    component: CallbackComponent
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  },

  // Contingencia temporal (vacío en QA/PROD)
  ...contingencyRoutes,

  // 2. Shell Corporativo Autenticado (Protegido con rassiniAuthGuard idéntico a SDK Demo)
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [rassiniAuthGuard],
    canActivateChild: [rassiniAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'pagos-pendientes',
        component: PagosPendientesComponent
      },
      {
        path: 'pagos-enviados',
        component: PagosEnviadosComponent
      },
      {
        path: 'pagos-errores',
        component: PagosErroresComponent
      },
      {
        path: 'pagos-analitica',
        component: PagosAnaliticaComponent
      },
      // Soporte resiliente para rutas que incluyan prefijo /portal-cxp
      {
        path: 'portal-cxp/dashboard',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'portal-cxp/pagos-pendientes',
        redirectTo: 'pagos-pendientes',
        pathMatch: 'full'
      },
      {
        path: 'portal-cxp/pagos-enviados',
        redirectTo: 'pagos-enviados',
        pathMatch: 'full'
      },
      {
        path: 'portal-cxp/pagos-errores',
        redirectTo: 'pagos-errores',
        pathMatch: 'full'
      },
      {
        path: 'portal-cxp/pagos-analitica',
        redirectTo: 'pagos-analitica',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback seguro: Redirige a dashboard dentro de la sesión activa si no coincide ninguna ruta
  { path: '**', redirectTo: 'dashboard' }
];
