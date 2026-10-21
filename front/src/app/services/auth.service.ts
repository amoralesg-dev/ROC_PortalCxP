
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthenticationService, CorporateUser, CorporateBusinessUnit } from 'rassini-ui';

export interface LoginRequest {
  usuario: string;
  password?: string;
}

export interface LoginResponse {
  id: number;
  usuario: string;
  nombre: string;
  bu: string;
  rol: string;
  fechaCreacion: string;
  activo: boolean;
}

export interface BuDto {
  codigo: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  private readonly corporateAuth = inject(AuthenticationService, { optional: true });

  constructor(private http: HttpClient, private router: Router) { }

  /**
   * Sincroniza la sesión interna de CxP con los claims provistos por el Access Token / ID Token
   * de rassini-ui (flujo OIDC corporativo idéntico a SDK Demo).
   */
  syncFromCorporateOidc(): void {
    if (!this.corporateAuth) {
      return;
    }
    const user: CorporateUser | null = this.corporateAuth.currentUser();
    const bus: CorporateBusinessUnit[] = this.corporateAuth.businessUnits() || [];
    const roles: string[] = this.corporateAuth.roles() || [];
    const hasAllBus: boolean = this.corporateAuth.hasAllBusinessUnits() || false;

    if (user) {
      const username = user.username || user.email || '';
      sessionStorage.setItem('auth_usuario', username);
      sessionStorage.setItem('auth_nombre', username);

      // Business units resueltas directamente desde los claims corporativos
      let buValue = '';
      if (hasAllBus) {
        buValue = 'ALL';
      } else if (bus.length > 0) {
        buValue = bus.map(b => b.code).join(',');
      }
      sessionStorage.setItem('auth_bu', buValue);

      // Roles y permisos
      const rolValue = roles.length > 0 ? roles.join(',') : 'CxP';
      sessionStorage.setItem('auth_rol', rolValue);

      console.log('[AUTH SERVICE] Sincronizado exitosamente desde OIDC Claims:', {
        username,
        bu: buValue,
        roles: rolValue,
        hasAllBus,
        businessUnitsCount: bus.length
      });
    }
  }

  getUserBus(usuario: string): Observable<BuDto[]> {
    return this.http.get<BuDto[]>(`${this.baseUrl}/usuarios/${usuario}/bus`);
  }

  /**
   * Login clásico compatible para acceso directo con usuario y contraseña
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/usuarios/login`, credentials).pipe(
      tap(response => {
        if (response && response.usuario) {
          sessionStorage.setItem('auth_usuario', response.usuario);
          sessionStorage.setItem('auth_bu', response.bu || '');
          sessionStorage.setItem('auth_rol', response.rol || '');
        }
      })
    );
  }

  logout() {
    sessionStorage.removeItem('auth_usuario');
    sessionStorage.removeItem('auth_nombre');
    sessionStorage.removeItem('auth_bu');
    sessionStorage.removeItem('auth_rol');
    sessionStorage.removeItem('auth_contingencia');

    if (this.corporateAuth && (this.corporateAuth.isAuthenticated() || this.corporateAuth.hasValidTokenInStorage())) {
      this.corporateAuth.logout();
    } else {
      this.router.navigate(['/logout']);
    }
  }

  isLoggedIn(): boolean {
    if (this.corporateAuth && (this.corporateAuth.isAuthenticated() || this.corporateAuth.hasValidTokenInStorage())) {
      return true;
    }
    return !!sessionStorage.getItem('auth_usuario');
  }

  getCurrentUsername(): string {
    const user = this.corporateAuth?.currentUser();
    if (user?.username) {
      return user.username;
    }
    return sessionStorage.getItem('auth_usuario') || '';
  }

  /**
   * Obtiene las Business Units corporativas disponibles
   */
  getCorporateBusinessUnits(): CorporateBusinessUnit[] {
    return this.corporateAuth?.businessUnits() || [];
  }

  /**
   * Obtiene la Business Unit activa en el contexto de rassini-ui
   */
  getActiveCorporateBusinessUnit(): CorporateBusinessUnit | null {
    return this.corporateAuth?.activeBusinessUnit() || null;
  }
}

