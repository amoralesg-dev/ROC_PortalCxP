import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { Provider } from '@angular/core';

/**
 * Detecta y normaliza el base href o contexto de la aplicación dinámicamente en tiempo de ejecución.
 * 
 * Reglas de resolución:
 * 1. Si existe una etiqueta `<base href="...">` en el DOM que no sea '/', se respeta su valor normalizado.
 * 2. Si la etiqueta `<base>` no define un subcontexto, se inspecciona `pathname` en `PlatformLocation` / `window.location`.
 *    Si la URL comienza con `/portal-cxp` (con o sin barra final o subruta), se asigna `/portal-cxp/`.
 * 3. En cualquier otro caso, retorna `/` (raíz).
 *
 * @param pathname Ruta actual del navegador (ej. window.location.pathname)
 * @param baseHrefFromDom Valor leído directamente del atributo href del tag <base>
 */
export function resolveAppBaseHref(pathname: string, baseHrefFromDom?: string | null): string {
  if (baseHrefFromDom) {
    const trimmedDom = baseHrefFromDom.trim();
    // Si <base> tiene algo específico como '/portal-cxp/' o '/portal-cxp', respetarlo normalizado
    if (trimmedDom && trimmedDom !== '/' && trimmedDom !== '.') {
      let normalized = trimmedDom.startsWith('/') ? trimmedDom : `/${trimmedDom}`;
      if (!normalized.endsWith('/')) {
        normalized = `${normalized}/`;
      }
      return normalized;
    }
  }

  const cleanPath = pathname || '/';
  
  // Si la ruta inicia con /portal-cxp (/portal-cxp, /portal-cxp/, /portal-cxp/login, etc.)
  if (cleanPath === '/portal-cxp' || cleanPath.startsWith('/portal-cxp/')) {
    return '/portal-cxp/';
  }

  // Raíz por defecto
  return '/';
}

/**
 * Proveedor de Angular para configurar APP_BASE_HREF dinámicamente
 * soportando tanto la raíz ('/') como el subcontexto ('/portal-cxp/').
 */
export function provideDynamicBaseHref(): Provider {
  return {
    provide: APP_BASE_HREF,
    useFactory: (platformLocation: PlatformLocation) => {
      let baseHrefFromDom: string | null = null;
      if (typeof document !== 'undefined') {
        const baseElement = document.querySelector('base');
        if (baseElement) {
          baseHrefFromDom = baseElement.getAttribute('href');
        }
      }
      const pathname = platformLocation?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
      return resolveAppBaseHref(pathname, baseHrefFromDom);
    },
    deps: [PlatformLocation]
  };
}
