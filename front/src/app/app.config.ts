import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

import { provideRassiniTheme } from 'rassini-ui';

import { MessageService, ConfirmationService } from 'primeng/api';

import {
  provideTranslateService
} from '@ngx-translate/core';

import {
  provideTranslateHttpLoader
} from '@ngx-translate/http-loader';

import { provideDynamicBaseHref } from './services/context-path.service';
import { provideRassiniCorporate } from 'rassini-ui';
import { CXP_OIDC_CONFIG } from './config/oidc.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDynamicBaseHref(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideHttpClient(),

    provideTranslateService({
      lang: 'es',
      fallbackLang: 'es'
    }),

    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),

    provideRassiniTheme(),
    provideRassiniCorporate({
      oidc: CXP_OIDC_CONFIG
    }),

    MessageService,
    ConfirmationService
  ]
};