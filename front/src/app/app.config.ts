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

export const appConfig: ApplicationConfig = {
  providers: [
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

    MessageService,
    ConfirmationService
  ]
};