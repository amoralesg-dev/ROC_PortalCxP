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

  ngOnInit(): void {
    if (this.corporateAuth.isAuthenticated() || this.corporateAuth.hasValidTokenInStorage()) {
      this.authService.syncFromCorporateOidc();
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
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
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        },
        error: (err) => {
          this.error = err.message || 'Error al intercambiar el código por tokens en SSO IAM.';
          console.error('[CALLBACK OIDC] Fallo:', this.error);
        }
      });
    });
  }
}
