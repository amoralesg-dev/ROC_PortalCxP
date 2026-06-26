import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { EnvironmentBadgeService } from '../../services/environment-badge.service';


import {
  AppToast,
  RassiniLogin,
  Toast
} from 'rassini-ui';

interface LoginData {
  username: string;
  password: string;
}


/**
 * Adaptador temporal de autenticación para Portal de Pagos.
 *
 * Objetivo final:
 * - La autenticación debe vivir completamente en rassini-ui.
 * - Las apps consumidoras solo deberán usar RassiniLogin, Auth y authGuard.
 *
 * Estado actual:
 * - El backend corporativo definitivo para rassini-ui aún no está disponible.
 * - Por eso se usa visualmente RassiniLogin, pero la petición se envía
 *   temporalmente al AuthService propio de Portal de Pagos.
 *
 * Este componente debe eliminarse cuando rassini-ui tenga integrado
 * el backend oficial de autenticación.
 */

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RassiniLogin,
    AppToast
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit, OnDestroy {

  @ViewChild('ruiLoginHost', { read: ElementRef })
  private readonly ruiLoginHost?: ElementRef<HTMLElement>;

  private loginInProgress = false;

  private clickHandler?: (event: Event) => void;

  get environmentName(): string {
    return this.environmentBadgeService.environmentName;
  }

  get environmentClass(): string {
    return this.environmentBadgeService.environmentClass;
  }

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toast: Toast,
    private readonly environmentBadgeService: EnvironmentBadgeService
  ) {}

  ngAfterViewInit(): void {
    const host = this.ruiLoginHost?.nativeElement;

    if (!host) {
      return;
    }

    this.clickHandler = (event: Event): void => {
      const target = event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      const button = target.closest('button');

      if (!button) {
        return;
      }

      const buttonText = (button.textContent ?? '')
        .trim()
        .toLowerCase();

      if (!buttonText.includes('iniciar sesión')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const loginData = this.readLoginDataFromRuiLogin(host);

      this.executeLogin(loginData);
    };

    host.addEventListener(
      'click',
      this.clickHandler,
      true
    );
  }

  ngOnDestroy(): void {
    const host = this.ruiLoginHost?.nativeElement;

    if (!host || !this.clickHandler) {
      return;
    }

    host.removeEventListener(
      'click',
      this.clickHandler,
      true
    );
  }

  private executeLogin(loginData: LoginData): void {
    if (this.loginInProgress) {
      return;
    }

    if (!loginData.username) {
      this.toast.warn('El usuario es requerido');
      return;
    }

    if (!loginData.password) {
      this.toast.warn('La contraseña es requerida');
      return;
    }

    this.loginInProgress = true;

    this.authService.login({
      usuario: loginData.username,
      password: loginData.password
    }).subscribe({
      next: () => {
        this.toast.success('Login exitoso');

        this.router.navigate([
          '/pagos-pendientes'
        ]);
      },

      error: (error) => {
        this.loginInProgress = false;

        const message = this.getErrorMessage(error);

        this.toast.error(message);
      }
    });
  }

  private readLoginDataFromRuiLogin(host: HTMLElement): LoginData {
    const inputs = Array.from(
      host.querySelectorAll('input')
    ) as HTMLInputElement[];

    const usernameInput =
      inputs.find(input => input.type === 'text') ??
      inputs.find(input => input.type !== 'password');

    const passwordInput =
      inputs.find(input => input.type === 'password');

    return {
      username: usernameInput?.value?.trim() ?? '',
      password: passwordInput?.value ?? ''
    };
  }

  private getErrorMessage(error: any): string {
    const backendMessage = error?.error?.message;

    if (backendMessage) {
      return backendMessage;
    }

    if (error?.status === 400) {
      return 'Credenciales inválidas';
    }

    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor';
    }

    return 'Error al iniciar sesión';
  }

}