
import { Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';
import {
  AppToast,
  AppConfirmDialog,
  AppLoader
} from 'rassini-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule, MatSidenavModule, MatListModule, AppToast, AppConfirmDialog,AppLoader],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Rassini - Pagos');
  
  
  
  
  readonly environmentName = environment.environmentName.toUpperCase();

  readonly isProduction = environment.production;

  readonly environmentClass = this.getEnvironmentClass();

  private getEnvironmentClass(): string {

    if (this.isProduction) {
      return 'environment-prod';
    }

    if (environment.environmentName === 'dev') {
      return 'environment-dev';
    }

    return 'environment-local';

  }





  constructor(public authService: AuthService) {
    console.log('APP ROOT');
  }

  logout() {
    this.authService.logout();
  }
}
