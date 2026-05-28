
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) { }

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
    sessionStorage.removeItem('auth_bu');
    sessionStorage.removeItem('auth_rol');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('auth_usuario');
  }
}
