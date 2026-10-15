import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from 'rassini-ui';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <h2>Procesando autenticación corporativa SSO IAM (OIDC / PKCE)...</h2>
      <p *ngIf="error" style="color: red; font-weight: bold;">Error: {{ error }}</p>
      <p *ngIf="!error">Validando credenciales y extrayendo contexto corporativo...</p>
    </div>
  `
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly corporateAuth = inject(AuthenticationService);
  private readonly authService = inject(AuthService);

  error: string | null = null;

  private getAndClearTargetRoute(): string {
    const rawRedirect = sessionStorage.getItem('rassini_redirect_url');
    sessionStorage.removeItem('rassini_redirect_url');

    if (!rawRedirect || rawRedirect.trim() === '') {
      return '/dashboard';
    }

    try {
      let targetPath = rawRedirect.trim();

      // Si es una URL completa (ej. http://localhost:4200/portal-cxp/pagos-pendientes)
      if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
        const parsed = new URL(targetPath);
        targetPath = parsed.pathname + (parsed.search || '');
      }

      // Normalizar prefijo de subcontexto /portal-cxp
      if (targetPath.startsWith('/portal-cxp/')) {
        targetPath = targetPath.replace('/portal-cxp/', '/');
      } else if (targetPath === '/portal-cxp') {
        targetPath = '/';
      }

      // Evitar redirigir de vuelta a rutas técnicas de sesión
      if (
        targetPath === '/callback' ||
        targetPath.startsWith('/callback') ||
        targetPath === '/logout' ||
        targetPath.startsWith('/logout') ||
        targetPath === '/access-denied' ||
        targetPath === '/' ||
        targetPath === ''
      ) {
        return '/dashboard';
      }

      return targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    } catch {
      return '/dashboard';
    }
  }

  ngOnInit(): void {
    if (this.corporateAuth.isAuthenticated() || this.corporateAuth.hasValidTokenInStorage()) {
      this.authService.syncFromCorporateOidc();
      const target = this.getAndClearTargetRoute();
      this.router.navigateByUrl(target, { replaceUrl: true });
      return;
    }

    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      if (error) {
        this.error = params['error_description'] || error;
        console.error('[CALLBACK OIDC] Error devuelto por AS:', this.error);
        return;
      }

      if (!code || !state) {
        console.warn('[CALLBACK OIDC] Sin código o estado, redirigiendo a /logout');
        this.router.navigateByUrl('/logout', { replaceUrl: true });
        return;
      }

      this.corporateAuth.handleCallback(code, state).subscribe({
        next: () => {
          this.authService.syncFromCorporateOidc();
          const target = this.getAndClearTargetRoute();
          this.router.navigateByUrl(target, { replaceUrl: true });
        },
        error: (err) => {
          this.error = err.message || 'Error al intercambiar el código por tokens en SSO IAM.';
          console.error('[CALLBACK OIDC] Fallo:', this.error);
        }
      });
    });
  }
}

