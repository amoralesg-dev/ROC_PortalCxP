import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthenticationService } from 'rassini-ui';
import { AuthService } from '../../services/auth.service';
import { CallbackComponent } from './callback.component';
import { CXP_OIDC_CONFIG, getOidcRedirectUri } from '../../config/oidc.config';

describe('CallbackComponent & OIDC Configuration', () => {
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };
  let corporateAuthMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasValidTokenInStorage: ReturnType<typeof vi.fn>;
    handleCallback: ReturnType<typeof vi.fn>;
    getStorageAdapter: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
    businessUnits: ReturnType<typeof vi.fn>;
    roles: ReturnType<typeof vi.fn>;
    hasAllBusinessUnits: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: { syncFromCorporateOidc: ReturnType<typeof vi.fn> };
  let queryParamsSubject = of({ code: 'valid-auth-code', state: 'valid-state-123' });

  beforeEach(() => {
    sessionStorage.clear();
    routerMock = {
      navigateByUrl: vi.fn(),
      navigate: vi.fn()
    };
    corporateAuthMock = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      hasValidTokenInStorage: vi.fn().mockReturnValue(false),
      handleCallback: vi.fn().mockReturnValue(of({ accessToken: 'jwt-token' })),
      getStorageAdapter: vi.fn().mockReturnValue({
        getItem: (k: string) => sessionStorage.getItem(k),
        removeItem: (k: string) => sessionStorage.removeItem(k)
      }),
      currentUser: vi.fn().mockReturnValue({
        userId: 1,
        username: 'msantillan',
        email: 'msantillan@rassini.com',
        roles: ['CXP_USER'],
        permissions: ['CXP_ACCESS'],
        businessUnits: [],
        hasAllBusinessUnits: true
      }),
      businessUnits: vi.fn().mockReturnValue([]),
      roles: vi.fn().mockReturnValue(['CXP_USER']),
      hasAllBusinessUnits: vi.fn().mockReturnValue(true)
    };
    authServiceMock = {
      syncFromCorporateOidc: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthenticationService, useValue: corporateAuthMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            get queryParams() {
              return queryParamsSubject;
            }
          }
        }
      ]
    });
  });

  it('5. Callback: procesa code y state, recupera el destino original (resolvedUrl) y redirige a la ruta final permitida (/pagos-pendientes)', () => {
    sessionStorage.setItem(
      'rassini_redirect_url',
      'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-pendientes'
    );

    const fixture = TestBed.createComponent(CallbackComponent);
    fixture.detectChanges();

    expect(corporateAuthMock.handleCallback).toHaveBeenCalledWith('valid-auth-code', 'valid-state-123');
    expect(authServiceMock.syncFromCorporateOidc).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/pagos-pendientes', { replaceUrl: true });
    expect(sessionStorage.getItem('rassini_redirect_url')).toBeNull();
  });

  it('5b. Callback: soporta todas las rutas OIDC de Portal CxP (pagos-enviados, pagos-errores, pagos-analitica)', () => {
    const fixture = TestBed.createComponent(CallbackComponent);
    const component = fixture.componentInstance;

    sessionStorage.setItem('rassini_redirect_url', 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-enviados');
    expect(component.getAndClearTargetRoute()).toBe('/pagos-enviados');

    sessionStorage.setItem('rassini_redirect_url', 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-errores');
    expect(component.getAndClearTargetRoute()).toBe('/pagos-errores');

    sessionStorage.setItem('rassini_redirect_url', 'https://rss-cxp-dev.rassini.com/portal-cxp/pagos-analitica');
    expect(component.getAndClearTargetRoute()).toBe('/pagos-analitica');
  });

  it('6. Seguridad: rechaza dominios externos no permitidos o esquemas peligrosos (Open Redirect)', () => {
    const fixture = TestBed.createComponent(CallbackComponent);
    const component = fixture.componentInstance;

    sessionStorage.setItem('rassini_redirect_url', 'https://evil-attacker.com/portal-cxp/pagos-pendientes');
    expect(component.getAndClearTargetRoute()).toBe('/dashboard');

    sessionStorage.setItem('rassini_redirect_url', '//evil-attacker.com/phishing');
    expect(component.getAndClearTargetRoute()).toBe('/dashboard');

    sessionStorage.setItem('rassini_redirect_url', 'javascript:alert(document.cookie)');
    expect(component.getAndClearTargetRoute()).toBe('/dashboard');

    sessionStorage.setItem('rassini_redirect_url', 'evil-attacker.com/pagos-pendientes');
    expect(component.getAndClearTargetRoute()).toBe('/dashboard');
  });

  it('7. Configuración: el callback DEV usa /portal-cxp/callback y clientId ms-pagos-client coincidiendo con employee-portal', () => {
    expect(CXP_OIDC_CONFIG.clientId).toBe('ms-pagos-client');
    expect(CXP_OIDC_CONFIG.applicationCode).toBe('MS_PAGOS');

    const baseEl = document.createElement('base');
    baseEl.setAttribute('href', '/portal-cxp/');
    document.head.appendChild(baseEl);
    try {
      const redirectUri = getOidcRedirectUri();
      expect(redirectUri.endsWith('/portal-cxp/callback')).toBe(true);
    } finally {
      document.head.removeChild(baseEl);
    }
  });

  it('8. AuthService: syncFromCorporateOidc y getUserBus utilizan el correo completo (email) del usuario autenticado para consultar /usuarios/{correo}/bus', () => {
    const httpMock = {
      get: vi.fn().mockReturnValue(of([{ codigo: 'ALL', descripcion: 'ALL' }])),
      post: vi.fn()
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthenticationService, useValue: corporateAuthMock }
      ]
    });

    const realAuthService = TestBed.inject(AuthService);
    realAuthService.syncFromCorporateOidc();

    expect(sessionStorage.getItem('auth_usuario')).toBe('msantillan@rassini.com');
    expect(sessionStorage.getItem('auth_nombre')).toBe('msantillan');
    expect(realAuthService.getCurrentUsername()).toBe('msantillan@rassini.com');

    realAuthService.getUserBus('msantillan').subscribe();
    expect(httpMock.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/usuarios\/msantillan@rassini\.com\/bus$/)
    );
  });
});
