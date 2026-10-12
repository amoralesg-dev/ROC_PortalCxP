import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { resolveAppBaseHref } from './context-path.service';

describe('ContextPathService - resolveAppBaseHref', () => {
  it('debe retornar "/" cuando el pathname es la raíz y no hay base href en DOM', () => {
    expect(resolveAppBaseHref('/')).toBe('/');
    expect(resolveAppBaseHref('')).toBe('/');
  });

  it('debe retornar "/" para subrutas en la raíz cuando no es portal-cxp', () => {
    expect(resolveAppBaseHref('/login')).toBe('/');
    expect(resolveAppBaseHref('/pagos-pendientes')).toBe('/');
    expect(resolveAppBaseHref('/otra-ruta/detalle')).toBe('/');
  });

  it('debe detectar automáticamente "/portal-cxp/" cuando el pathname inicia con /portal-cxp', () => {
    expect(resolveAppBaseHref('/portal-cxp')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/portal-cxp/')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/portal-cxp/login')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/portal-cxp/pagos-pendientes')).toBe('/portal-cxp/');
  });

  it('debe priorizar el valor de la etiqueta <base href="..."> si viene configurado explícitamente', () => {
    expect(resolveAppBaseHref('/alguna-ruta', '/portal-cxp/')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/alguna-ruta', '/portal-cxp')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/alguna-ruta', 'portal-cxp')).toBe('/portal-cxp/');
  });

  it('debe ignorar la etiqueta <base> si contiene solo "/" o "." y resolver según pathname', () => {
    expect(resolveAppBaseHref('/portal-cxp/login', '/')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/portal-cxp/login', '.')).toBe('/portal-cxp/');
    expect(resolveAppBaseHref('/login', '/')).toBe('/');
  });
});
