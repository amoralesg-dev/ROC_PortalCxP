import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { 
  AuthenticationService, 
  NavigationService, 
  RassiniShell,
  RassiniMenuItem,
  CorporateNavigationMenu,
  RassiniI18nService
} from 'rassini-ui';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RassiniShell],
  template: `
    @if (authService.isAuthenticated()) {
      <rui-shell 
        [menu]="menuTree()" 
        (logout)="onLogout()">
        <router-outlet></router-outlet>
      </rui-shell>
    }
  `,
  host: {
    '(click)': 'onHostClick($event)'
  }
})
export class ShellLayoutComponent implements OnInit {
  readonly authService = inject(AuthenticationService);
  readonly navService = inject(NavigationService);
  private readonly legacyAuth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(RassiniI18nService);

  onHostClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && (target.classList?.contains('rui-logo') || target.closest('.rui-logo') || target.closest('.rui-topbar-left img'))) {
      event.preventDefault();
      event.stopPropagation();
      const targetUrl = environment.employeePortalUrl || '/employee-portal';
      window.location.href = targetUrl;
    }
  }

  readonly menuTree = computed<RassiniMenuItem[]>(() => {
    // Suscripción reactiva explícita al cambio de idioma
    this.i18n.currentLang();

    if (!this.authService.isAuthenticated()) {
      return [];
    }
    const rawMenus = this.navService.menus();
    if (!rawMenus || rawMenus.length === 0) {
      return [
        {
          code: 'CXP_ROOT',
          label: 'Cuentas por Pagar',
          items: [
            { code: 'CXP_PENDIENTES', label: 'Pagos Pendientes', icon: 'pi pi-wallet', routerLink: '/pagos-pendientes' },
            { code: 'CXP_ENVIADOS', label: 'Pagos Enviados', icon: 'pi pi-history', routerLink: '/pagos-enviados' },
            { code: 'CXP_ERRORES', label: 'Pagos con Error', icon: 'pi pi-exclamation-circle', routerLink: '/pagos-errores' },
            { code: 'CXP_ANALITICA', label: 'Analítica Pendientes', icon: 'pi pi-chart-bar', routerLink: '/pagos-analitica' }
          ]
        }
      ];
    }

    return this.mapCorporateMenusToRassiniItems(rawMenus);
  });

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.legacyAuth.syncFromCorporateOidc();
      this.navService.loadNavigation('MS_PAGOS').subscribe({
        error: (err) => console.warn('[SHELL LAYOUT] Error al cargar menús remotos, usando fallback local:', err)
      });
    }
  }

  onLogout(): void {
    this.navService.clear();
    this.legacyAuth.logout();
  }

  private mapCorporateMenusToRassiniItems(menus: CorporateNavigationMenu[]): RassiniMenuItem[] {
    return menus.map(m => {
      let targetRoute = m.route;
      if (targetRoute && targetRoute.startsWith('/employee-portal/')) {
        targetRoute = '/' + targetRoute.replace('/employee-portal/', '');
      }

      let isLocalToCurrentApp = false;
      if (m.externalUrl && typeof window !== 'undefined' && window.location) {
        try {
          const parsed = new URL(m.externalUrl, window.location.origin);
          if (parsed.origin === window.location.origin) {
            let pathname = parsed.pathname || '';
            // Normalizar eliminando el base href /portal-cxp/ o /portal-cxp
            if (pathname.startsWith('/portal-cxp/')) {
              pathname = pathname.replace('/portal-cxp/', '/');
            } else if (pathname === '/portal-cxp') {
              pathname = '/';
            }
            targetRoute = pathname + (parsed.search || '');
            isLocalToCurrentApp = true;
          }
        } catch {
          // URL no parseable
        }
      }

      const isLogoutOption = m.code === 'CXP_LOGOUT' || 
                             targetRoute === '/logout' || 
                             (m.externalUrl != null && m.externalUrl.endsWith('/logout'));

      if (isLogoutOption) {
        return {
          code: m.code,
          label: m.label,
          icon: m.icon || 'pi pi-sign-out',
          command: () => this.onLogout(),
          targetType: 'INTERNO',
          routerLink: undefined,
          externalUrl: undefined,
          resolvedUrl: undefined,
          openInNewTab: false
        };
      }

      if (isLocalToCurrentApp) {
        return {
          code: m.code,
          label: m.label,
          icon: m.icon || 'pi pi-circle',
          routerLink: targetRoute,
          targetType: 'INTERNO',
          externalUrl: undefined,
          resolvedUrl: undefined,
          openInNewTab: false,
          items: m.children && m.children.length > 0 ? this.mapCorporateMenusToRassiniItems(m.children) : undefined
        };
      }

      return {
        code: m.code,
        label: m.label,
        icon: m.icon || 'pi pi-circle',
        routerLink: targetRoute,
        targetType: m.targetType,
        externalUrl: m.externalUrl || undefined,
        resolvedUrl: m.resolvedUrl || undefined,
        openInNewTab: m.openInNewTab,
        items: m.children && m.children.length > 0 ? this.mapCorporateMenusToRassiniItems(m.children) : undefined
      };
    });
  }
}
