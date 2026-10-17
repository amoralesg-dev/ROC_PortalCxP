import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService, NavigationService, RassiniSessionClosedComponent } from 'rassini-ui';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, RassiniSessionClosedComponent],
  template: `
    <rui-session-closed
      (returnClick)="goToEmployeePortal()">
    </rui-session-closed>
  `
})
export class LogoutComponent implements OnInit {
  private readonly corporateAuth = inject(AuthenticationService);
  private readonly navService = inject(NavigationService);
  private readonly legacyAuth = inject(AuthService);

  readonly portalUrl = environment.employeePortalUrl || 'http://localhost:4205/employee-portal';

  ngOnInit(): void {
    this.navService.clear();
    sessionStorage.removeItem('auth_usuario');
    sessionStorage.removeItem('auth_nombre');
    sessionStorage.removeItem('auth_bu');
    sessionStorage.removeItem('auth_rol');
    sessionStorage.removeItem('auth_contingencia');
    if (this.corporateAuth.isAuthenticated() || this.corporateAuth.hasValidTokenInStorage()) {
      this.corporateAuth.logout(false);
    }
  }

  goToEmployeePortal(): void {
    const base = this.portalUrl.endsWith('/') ? this.portalUrl.slice(0, -1) : this.portalUrl;
    const targetUrl = base.includes('/auth/login') 
      ? `${base}?oidc_logout=1` 
      : `${base}/auth/login?oidc_logout=1`;
    window.location.href = targetUrl;
  }
}
