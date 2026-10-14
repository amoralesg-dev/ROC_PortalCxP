import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  AppToast,
  AppConfirmDialog,
  AppLoader
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
  constructor(private readonly translate: TranslateService) {
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    const supportedLanguages = ['es', 'en'];
    const language = supportedLanguages.includes(browserLang) ? browserLang : 'es';

    this.translate.use(language).subscribe();
    this.translate.setFallbackLang('es');
  }

  ngOnInit(): void {
    console.log('[APP ROOT] Initialized with Rassini Corporate Shell');
  }
}