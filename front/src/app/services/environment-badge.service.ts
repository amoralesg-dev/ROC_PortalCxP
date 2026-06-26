import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentBadgeService {

  get environmentName(): string {
    return environment.environmentName.toUpperCase();
  }

  get environmentClass(): string {
    if (this.isProduction) {
      return 'environment-prod';
    }

    if (this.isDev) {
      return 'environment-dev';
    }

    return 'environment-local';
  }

  get isProduction(): boolean {
    return environment.production;
  }

  get isLocal(): boolean {
    return environment.environmentName === 'local';
  }

  get isDev(): boolean {
    return environment.environmentName === 'dev';
  }

}