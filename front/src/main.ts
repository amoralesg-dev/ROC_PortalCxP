import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig, contingencyAppConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

/**
 * La contingencia temporal solo arranca en modo aislado (sin provideRassiniCorporate) si el flag
 * del ambiente lo permite Y la URL es /contingencia*. En cualquier otro caso (y siempre en
 * QA/PROD) el arranque es el OIDC corporativo normal.
 */
const path = window.location.pathname;
const isContingency =
  environment.legacyLoginEnabled === true &&
  /(^|\/)contingencia(\/|$)/.test(path);

bootstrapApplication(App, isContingency ? contingencyAppConfig : appConfig)
  .catch((err) => console.error(err));
