/**
 * CONTINGENCIA TEMPORAL (soporte / diagnóstico / validación de despliegues).
 *
 * - Solo existe cuando environment.legacyLoginEnabled === true (local y DEV).
 *   En QA y PROD las rutas NO se registran (ver app.routes.ts) y cualquier
 *   intento de acceder a /contingencia cae en el wildcard -> /logout.
 * - NO forma parte del flujo principal: la entrada oficial sigue siendo OIDC.
 * - No aparece en menús, en la navegación corporativa ni en IAM.
 * - Es independiente de rui-shell y de rassiniAuthGuard (no se modifican).
 *
 * Retirar este directorio y su registro en app.routes.ts al terminar la
 * estabilización en DEV.
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export const CONTINGENCY_FLAG_KEY = 'auth_contingencia';

export const contingencyGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (
    environment.legacyLoginEnabled &&
    sessionStorage.getItem(CONTINGENCY_FLAG_KEY) === '1' &&
    !!sessionStorage.getItem('auth_usuario')
  ) {
    return true;
  }
  return router.parseUrl('/contingencia');
};

@Component({
  selector: 'app-contingencia-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:sans-serif;">
      <form (ngSubmit)="submit()" style="background:#fff;padding:2rem;border-radius:12px;border:2px dashed #ea580c;width:360px;box-shadow:0 10px 25px rgba(0,0,0,.08);">
        <div style="background:#fff7ed;color:#c2410c;padding:8px 12px;border-radius:6px;font-size:.85rem;font-weight:600;margin-bottom:1rem;">
          ACCESO DE CONTINGENCIA (solo soporte / validación en {{ envName }})
        </div>
        <label style="display:block;font-size:.85rem;margin-bottom:4px;">Usuario</label>
        <input name="usuario" [(ngModel)]="usuario" autocomplete="username" required
               style="width:100%;padding:8px;margin-bottom:12px;box-sizing:border-box;" />
        <label style="display:block;font-size:.85rem;margin-bottom:4px;">Contraseña</label>
        <input name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required
               style="width:100%;padding:8px;margin-bottom:12px;box-sizing:border-box;" />
        @if (error()) {
          <p id="contingencia-error" style="color:#dc2626;font-size:.85rem;">{{ error() }}</p>
        }
        <button type="submit" id="contingencia-submit" [disabled]="loading()"
                style="width:100%;padding:10px;background:#ea580c;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
          {{ loading() ? 'Validando...' : 'Ingresar (contingencia)' }}
        </button>
      </form>
    </div>
  `
})
export class ContingenciaLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly envName = environment.environmentName.toUpperCase();
  usuario = '';
  password = '';
  // signals: la app es zoneless, las propiedades planas no refrescan la vista
  readonly error = signal('');
  readonly loading = signal(false);

  submit(): void {
    if (!this.usuario || !this.password) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login({ usuario: this.usuario, password: this.password }).subscribe({
      next: (resp) => {
        this.loading.set(false);
        if (resp && resp.usuario) {
          sessionStorage.clear();
          sessionStorage.setItem('auth_usuario', resp.usuario);
          sessionStorage.setItem('auth_nombre', resp.nombre || resp.usuario);
          sessionStorage.setItem('auth_bu', resp.bu || '');
          sessionStorage.setItem('auth_rol', resp.rol || '');
          sessionStorage.setItem(CONTINGENCY_FLAG_KEY, '1');
          this.router.navigateByUrl('/contingencia/app/pagos-pendientes', { replaceUrl: true });
        } else {
          this.error.set('Credenciales inválidas.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Credenciales inválidas o servicio no disponible.');
      }
    });
  }
}

@Component({
  selector: 'app-contingencia-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div style="background:#c2410c;color:#fff;padding:6px 16px;font-size:.8rem;font-weight:600;">
      MODO CONTINGENCIA ({{ envName }}) — sesión local, no corporativa. Usuario: {{ usuario }}
      <button id="contingencia-logout" (click)="logout()"
              style="float:right;background:#fff;color:#c2410c;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;">Salir</button>
    </div>
    <nav style="display:flex;gap:16px;padding:10px 16px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
      <a routerLink="/contingencia/app/pagos-pendientes" routerLinkActive="active">Pagos Pendientes</a>
      <a routerLink="/contingencia/app/pagos-enviados" routerLinkActive="active">Pagos Enviados</a>
      <a routerLink="/contingencia/app/pagos-errores" routerLinkActive="active">Pagos con Error</a>
      <a routerLink="/contingencia/app/pagos-analitica" routerLinkActive="active">Analítica Pendientes</a>
    </nav>
    <main style="padding:24px;"><router-outlet></router-outlet></main>
  `
})
export class ContingenciaLayoutComponent {
  private readonly router = inject(Router);
  readonly envName = environment.environmentName.toUpperCase();
  readonly usuario = sessionStorage.getItem('auth_usuario') || '';

  logout(): void {
    ['auth_usuario', 'auth_nombre', 'auth_bu', 'auth_rol', CONTINGENCY_FLAG_KEY]
      .forEach(k => sessionStorage.removeItem(k));
    this.router.navigateByUrl('/contingencia', { replaceUrl: true });
  }
}
