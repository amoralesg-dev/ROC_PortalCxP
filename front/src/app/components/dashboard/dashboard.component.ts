import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  AuthenticationService, 
  PageHeaderComponent, 
  PageContentComponent 
} from 'rassini-ui';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageContentComponent],
  template: `
    <app-page-header 
      title="Portal de Cuentas por Pagar - Panel Principal" 
      subtitle="Bienvenido a la plataforma corporativa de gestión de pagos y proveedores" 
      icon="pi pi-th-large">
    </app-page-header>

    <app-page-content>
      <!-- Resumen de Identidad del Usuario -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-size: 1.15rem; margin-top: 0; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
          👤 Sesión Corporativa Activa
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; font-size: 0.95rem;">
          <div><strong>Usuario:</strong> {{ displayUsername }}</div>
          <div><strong>Correo:</strong> {{ displayEmail }}</div>
          <div><strong>Business Units:</strong> {{ displayBus }}</div>
          <div><strong>Roles:</strong> {{ displayRoles }}</div>
        </div>
      </div>

      <!-- Accesos Directos a Módulos de Pagos -->
      <h3 style="font-size: 1.1rem; color: #334155; margin-bottom: 16px;">Accesos Directos</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
        <!-- Card 1: Pagos Pendientes -->
        <a routerLink="/pagos-pendientes" style="text-decoration: none; color: inherit;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border-left: 4px solid #ea580c;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
               onmouseout="this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <i class="pi pi-wallet" style="font-size: 1.5rem; color: #ea580c;"></i>
              <h4 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Pagos Pendientes</h4>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
              Revisión, autorización y dispersión de órdenes de pago pendientes.
            </p>
          </div>
        </a>

        <!-- Card 2: Pagos Enviados -->
        <a routerLink="/pagos-enviados" style="text-decoration: none; color: inherit;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border-left: 4px solid #0284c7;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
               onmouseout="this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <i class="pi pi-history" style="font-size: 1.5rem; color: #0284c7;"></i>
              <h4 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Pagos Enviados</h4>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
              Historial y seguimiento de transferencias procesadas exitosamente.
            </p>
          </div>
        </a>

        <!-- Card 3: Pagos con Error -->
        <a routerLink="/pagos-errores" style="text-decoration: none; color: inherit;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border-left: 4px solid #dc2626;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
               onmouseout="this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <i class="pi pi-exclamation-circle" style="font-size: 1.5rem; color: #dc2626;"></i>
              <h4 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Pagos con Error</h4>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
              Monitoreo y resolución de incidencias en pagos rechazados por el banco.
            </p>
          </div>
        </a>

        <!-- Card 4: Analítica Pendientes -->
        <a routerLink="/pagos-analitica" style="text-decoration: none; color: inherit;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border-left: 4px solid #16a34a;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
               onmouseout="this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <i class="pi pi-chart-bar" style="font-size: 1.5rem; color: #16a34a;"></i>
              <h4 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Analítica Pendientes</h4>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
              Estadísticas y métricas consolidadas de saldos por vencer y flujo de caja.
            </p>
          </div>
        </a>
      </div>
    </app-page-content>
  `
})
export class DashboardComponent {
  private readonly corporateAuth = inject(AuthenticationService, { optional: true });
  private readonly legacyAuth = inject(AuthService);

  get displayUsername(): string {
    return this.corporateAuth?.currentUser()?.username || sessionStorage.getItem('auth_usuario') || 'Usuario';
  }

  get displayEmail(): string {
    return this.corporateAuth?.currentUser()?.email || 'N/A';
  }

  get displayBus(): string {
    if (this.corporateAuth?.hasAllBusinessUnits()) {
      return 'Todas (ALL)';
    }
    const bus = this.corporateAuth?.businessUnits();
    if (bus && bus.length > 0) {
      return bus.map(b => b.code).join(', ');
    }
    return sessionStorage.getItem('auth_bu') || 'N/A';
  }

  get displayRoles(): string {
    const roles = this.corporateAuth?.roles();
    if (roles && roles.length > 0) {
      return roles.join(', ');
    }
    return sessionStorage.getItem('auth_rol') || 'CXP_USER';
  }
}
