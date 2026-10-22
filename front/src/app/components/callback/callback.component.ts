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

  /**
   * Valida si un origen (protocol + host + port) es de confianza dentro del ecosistema corporativo.
   */
  private isTrustedRedirectOrigin(origin: string): boolean {
    const currentOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    if (currentOrigin && origin === currentOrigin) {
      return true;
    }
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === 'rss-cxp-dev.rassini.com' ||
        host.endsWith('.rassini.com')
      );
    } catch {
      return false;
    }
  }

  getAndClearTargetRoute(): string {
    const storageAdapter = this.corporateAuth.getStorageAdapter?.();
    const rawFromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rassini_redirect_url') : null;
    const rawFromAdapter = storageAdapter ? storageAdapter.getItem('rassini_redirect_url') : null;
    const rawFromPrefixed = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rassini_MS_PAGOS_rassini_redirect_url') : null;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('rassini_redirect_url');
      sessionStorage.removeItem('rassini_MS_PAGOS_rassini_redirect_url');
    }
    if (storageAdapter) {
      storageAdapter.removeItem('rassini_redirect_url');
    }

    const rawRedirect = rawFromSession || rawFromAdapter || rawFromPrefixed;
    if (!rawRedirect || rawRedirect.trim() === '') {
      return '/dashboard';
    }

    try {
      let targetPath = rawRedirect.trim();
      const lower = targetPath.toLowerCase();

      // Bloquear esquemas peligrosos o URLs protocol-relative (//evil.com) para evitar Open Redirect
      if (
        targetPath.startsWith('//') ||
        lower.startsWith('javascript:') ||
        lower.startsWith('data:') ||
        lower.startsWith('vbscript:') ||
        lower.startsWith('file:')
      ) {
        return '/dashboard';
      }

      // Si es una URL completa (ej. https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes)
      if (lower.startsWith('http://') || lower.startsWith('https://')) {
        const parsed = new URL(targetPath);
        if (!this.isTrustedRedirectOrigin(parsed.origin)) {
          console.warn('[CALLBACK OIDC] Origen externo no permitido rechazado:', parsed.origin);
          return '/dashboard';
        }
        targetPath = parsed.pathname + (parsed.search || '');
      } else if (!targetPath.startsWith('/')) {
        // Evitar rutas relativas ambiguas que puedan interpretarse como host externo (ej. evil.com/path)
        if (targetPath.includes('://') || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/|$)/.test(targetPath)) {
          return '/dashboard';
        }
        targetPath = `/${targetPath}`;
      }

      // Normalizar prefijo de subcontexto /portal-cxp
      if (targetPath.startsWith('/portal-cxp/')) {
        targetPath = targetPath.replace('/portal-cxp/', '/');
      } else if (targetPath === '/portal-cxp') {
        targetPath = '/';
      }

      // Evitar redirigir de vuelta a rutas técnicas de sesión o a otro portal
      if (
        targetPath === '/callback' ||
        targetPath.startsWith('/callback?') ||
        targetPath.startsWith('/callback/') ||
        targetPath === '/logout' ||
        targetPath.startsWith('/logout?') ||
        targetPath.startsWith('/logout/') ||
        targetPath === '/access-denied' ||
        targetPath.startsWith('/employee-portal') ||
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

