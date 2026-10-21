import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  AppToast,
  AppConfirmDialog,
  AppLoader,
  RassiniI18nService
} from 'rassini-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppToast,
    AppConfirmDialog,
    AppLoader
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  constructor(
    private readonly translate: TranslateService,
    private readonly ruiI18n: RassiniI18nService
  ) {
    // 1. Conectar resolver de rassini-ui con el TranslateService de ngx-translate
    this.ruiI18n.setExternalResolver((key: string, lang: any) => {
      const res = this.translate.instant(key);
      return res && res !== key ? res : undefined;
    });

    // 2. Normalizar e inicializar idioma
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    const supportedLanguages = ['es', 'en'];
    const language = supportedLanguages.includes(browserLang) ? browserLang : 'es';

    const ruiLang = this.ruiI18n.normalizeLanguage(language);
    this.ruiI18n.setLanguage(ruiLang);
    this.translate.setFallbackLang('es');

    this.translate.use(language).subscribe(() => {
      // Re-notificar a rassini-ui para re-evaluar reactivamente los textos
      this.ruiI18n.setLanguage(ruiLang);
    });

    this.translate.onLangChange.subscribe((event) => {
      const normalized = this.ruiI18n.normalizeLanguage(event.lang);
      if (this.ruiI18n.currentLang() !== normalized) {
        this.ruiI18n.setLanguage(normalized);
      }
    });
  }

  ngOnInit(): void {
    console.log('[APP ROOT] Initialized with Rassini Corporate Shell');
  }
}