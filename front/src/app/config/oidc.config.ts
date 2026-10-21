import { CorporateOidcConfig } from 'rassini-ui';
import { environment } from '../../environments/environment';
import { resolveAppBaseHref } from '../services/context-path.service';

function getBaseHrefFromDom(): string | null {
  if (typeof document !== 'undefined') {
    const baseEl = document.querySelector('base');
    if (baseEl) {
      return baseEl.getAttribute('href');
    }
  }
  return null;
}

/**
 * Obtiene el redirectUri dinámicamente según window.location.origin y el contexto activo.
 * Soporta raíz (/callback) y subcontextos (/portal-cxp/callback) en Local, DEV, QA y PROD.
 */
export function getOidcRedirectUri(): string {
  if (typeof window === 'undefined') {
    return '/portal-cxp/callback';
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname || '/';
  const baseHref = resolveAppBaseHref(pathname, getBaseHrefFromDom());
  if (baseHref === '/portal-cxp/' || pathname === '/portal-cxp' || pathname.startsWith('/portal-cxp/') || environment.environmentName === 'dev') {
    return `${origin}/portal-cxp/callback`;
  }
  return `${origin}/callback`;
}

/**
 * Obtiene el postLogoutRedirectUri dinámicamente según window.location.origin y el contexto activo.
 * Tras el logout OIDC, redirige a /logout corporativo o al login oficial de Portal de Empleados.
 */
export function getOidcPostLogoutRedirectUri(): string {
  if (typeof window === 'undefined') {
    return `${environment.employeePortalUrl}/auth/login`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname || '/';
  const baseHref = resolveAppBaseHref(pathname, getBaseHrefFromDom());
  if (baseHref === '/portal-cxp/' || pathname === '/portal-cxp' || pathname.startsWith('/portal-cxp/') || environment.environmentName === 'dev') {
    return `${origin}/portal-cxp/logout`;
  }
  return `${origin}/logout`;
}

export const CXP_OIDC_CONFIG: CorporateOidcConfig = {
  applicationCode: 'MS_PAGOS',
  clientId: 'ms-pagos-client',
  issuer: environment.oidcIssuer,
  redirectUri: getOidcRedirectUri(),
  postLogoutRedirectUri: getOidcPostLogoutRedirectUri(),
  scope: 'openid profile email roles permissions business_units',
  allowedApiOrigins: environment.allowedApiOrigins || []
};
