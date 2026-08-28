import { Component, signal, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

import { AuthService, BuDto } from './services/auth.service';
import { environment } from '../environments/environment';

import { TranslateService,TranslatePipe  } from '@ngx-translate/core';

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
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    AppToast,
    AppConfirmDialog,
    AppLoader,
    TranslatePipe,
    FormsModule,
    SelectModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {

  protected readonly title = signal('Rassini - Pagos');

  readonly environmentName =
    environment.environmentName.toUpperCase();

  readonly isProduction =
    environment.production;

  readonly environmentClass =
    this.getEnvironmentClass();

  private getEnvironmentClass(): string {

    if (this.isProduction) {
      return 'environment-prod';
    }

    if (environment.environmentName === 'dev') {
      return 'environment-dev';
    }

    return 'environment-local';

  }

  constructor(
    public authService: AuthService,
    private readonly translate: TranslateService
  ) {

    console.log('APP ROOT');

    const browserLang =
      navigator.language
        .split('-')[0]
        .toLowerCase();

    const supportedLanguages = [
      'es',
      'en'
    ];

    const language =
      supportedLanguages.includes(browserLang)
        ? browserLang
        : 'es';

    console.log(
      'Idioma navegador:',
      navigator.language
    );

    console.log(
      'Idioma seleccionado:',
      language
    );

    this.translate.use(language).subscribe(() => {

        console.log(
            'Idioma cargado:',
            language
        );

    });
    this.translate.setFallbackLang('es');

  }

  ngOnInit() {
  }

  logout(): void {

    this.authService.logout();

  }

}